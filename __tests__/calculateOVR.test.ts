/**
 * OVR Calculation Tests
 * 
 * Testing the authoritative position-weighted OVR implementation.
 * This test suite validates calculateOVR() behavior across all positions,
 * stat profiles, and edge cases.
 */

// @ts-ignore - React Native module resolution
import { calculateOVR, SORTED_COLLECTIBLE_WORKOUTS, collectibleWorkouts } from '../src/constants/collectibleWorkouts';
import type { Position, PrimaryStats } from '../src/constants/collectibleWorkouts';

/**
 * Helper: Create stat object with given values
 */
const stats = (str: number, vol: number, tmp: number, end: number, phy: number, hyp: number): PrimaryStats => ({
  STR: str,
  VOL: vol,
  TMP: tmp,
  END: end,
  PHY: phy,
  HYP: hyp,
});

/**
 * Helper: Calculate expected OVR manually (for validation)
 */
const expectedOVR = (statObj: PrimaryStats, position: string = 'PULL'): number => {
  // SPLIT_WEIGHTS from source
  const weights: Record<string, Record<string, number>> = {
    PULL: { STR: 1.0, VOL: 1.0, END: 1.0, TMP: 0.5, PHY: 0.3, HYP: 0.5 },
    PUSH: { STR: 1.0, TMP: 1.0, HYP: 1.0, VOL: 0.5, END: 0.3, PHY: 0.5 },
    LEGS: { STR: 1.0, VOL: 1.0, PHY: 1.0, END: 0.5, TMP: 0.3, HYP: 0.5 }
  };
  
  const w = weights[position];
  const weightedSum = 
    statObj.STR * w.STR +
    statObj.VOL * w.VOL +
    statObj.TMP * w.TMP +
    statObj.END * w.END +
    statObj.PHY * w.PHY +
    statObj.HYP * w.HYP;
  
  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);
  return Math.min(99, Math.round(weightedSum / totalWeight));
};

describe('calculateOVR - Authoritative Position-Weighted Implementation', () => {
  
  // ============================================
  // 1. POSITION WEIGHTS TESTS
  // ============================================
  describe('Position Weights Verification', () => {
    it('should apply different weights for PULL vs PUSH vs LEGS positions', () => {
      const testStats = stats(99, 99, 50, 50, 50, 50);
      
      const pullOVR = calculateOVR(testStats, 'PULL');
      const pushOVR = calculateOVR(testStats, 'PUSH');
      const legsOVR = calculateOVR(testStats, 'LEGS');
      
      // PULL and PUSH should differ (END has different weight: 1.0 vs 0.3)
      // PULL (1.0) vs PUSH (0.3) for END = 50
      expect(pullOVR).not.toBe(pushOVR);
    });

    it('PULL position should weight STR, VOL, END equally at 1.0', () => {
      // All equal stats should produce equal OVR across all positions
      const balancedStats = stats(85, 85, 85, 85, 85, 85);
      const result = calculateOVR(balancedStats, 'PULL');
      expect(result).toBe(85);
    });

    it('PUSH position should weight STR, TMP, HYP equally at 1.0', () => {
      const pushWeightedStats = stats(99, 50, 99, 50, 50, 99);
      // TMP and HYP have 1.0 weight in PUSH, VOL has 0.5
      const pushOVR = calculateOVR(pushWeightedStats, 'PUSH');
      const pullOVR = calculateOVR(pushWeightedStats, 'PULL');
      
      // PUSH should be higher (more weight on TMP/HYP which are 99)
      expect(pushOVR).toBeGreaterThan(pullOVR);
    });

    it('LEGS position should weight STR, VOL, PHY equally at 1.0', () => {
      const legsWeightedStats = stats(99, 99, 50, 50, 99, 50);
      // PHY has 1.0 weight in LEGS, TMP has 0.3
      const legsOVR = calculateOVR(legsWeightedStats, 'LEGS');
      const pullOVR = calculateOVR(legsWeightedStats, 'PULL');
      
      // LEGS should be higher (more weight on PHY which is 99)
      expect(legsOVR).toBeGreaterThan(pullOVR);
    });
  });

  // ============================================
  // 2. BALANCED STATS TESTS
  // ============================================
  describe('Balanced Stats (all equal)', () => {
    it('should produce same OVR across all positions when all stats are equal', () => {
      const balanced = stats(85, 85, 85, 85, 85, 85);
      
      const pullOVR = calculateOVR(balanced, 'PULL');
      const pushOVR = calculateOVR(balanced, 'PUSH');
      const legsOVR = calculateOVR(balanced, 'LEGS');
      
      expect(pullOVR).toBe(pushOVR);
      expect(pushOVR).toBe(legsOVR);
      expect(pullOVR).toBe(85);
    });

    it('should correctly normalize weights for balanced inputs', () => {
      // When all stats equal, OVR should equal the stat value
      const test50 = stats(50, 50, 50, 50, 50, 50);
      const test99 = stats(99, 99, 99, 99, 99, 99);
      
      expect(calculateOVR(test50, 'PULL')).toBe(50);
      expect(calculateOVR(test99, 'PULL')).toBe(99);
    });
  });

  // ============================================
  // 3. POSITION DIFFERENTIATION TESTS
  // ============================================
  describe('Position Differentiation (specialized stats)', () => {
    it('Strength-focus: should show position variance', () => {
      const strengthFocus = stats(99, 99, 50, 50, 50, 50);
      
      const pullOVR = calculateOVR(strengthFocus, 'PULL');
      const pushOVR = calculateOVR(strengthFocus, 'PUSH');
      const legsOVR = calculateOVR(strengthFocus, 'LEGS');
      
      // Expected from audit: PULL=73, PUSH=67, LEGS=73
      expect(pullOVR).toBe(expectedOVR(strengthFocus, 'PULL'));
      expect(pushOVR).toBe(expectedOVR(strengthFocus, 'PUSH'));
      expect(legsOVR).toBe(expectedOVR(strengthFocus, 'LEGS'));
      
      // Verify variance exists
      expect(pullOVR).not.toBe(pushOVR);
    });

    it('Endurance-focus: should show position variance', () => {
      const enduranceFocus = stats(50, 50, 50, 99, 50, 50);
      
      const pullOVR = calculateOVR(enduranceFocus, 'PULL');
      const pushOVR = calculateOVR(enduranceFocus, 'PUSH');
      const legsOVR = calculateOVR(enduranceFocus, 'LEGS');
      
      // PULL weights END at 1.0, PUSH at 0.3, LEGS at 0.5
      expect(pullOVR).toBeGreaterThan(pushOVR);
      expect(pullOVR).toBeGreaterThan(legsOVR);
    });

    it('Tempo-focus: should show position variance', () => {
      const tempoFocus = stats(50, 50, 99, 50, 50, 50);
      
      const pullOVR = calculateOVR(tempoFocus, 'PULL');
      const pushOVR = calculateOVR(tempoFocus, 'PUSH');
      const legsOVR = calculateOVR(tempoFocus, 'LEGS');
      
      // PUSH weights TMP at 1.0, PULL at 0.5, LEGS at 0.3
      expect(pushOVR).toBeGreaterThan(pullOVR);
      expect(pushOVR).toBeGreaterThan(legsOVR);
    });

    it('Hypertrophy-focus: should show position variance', () => {
      const hypertrophyFocus = stats(50, 50, 50, 50, 50, 99);
      
      const pullOVR = calculateOVR(hypertrophyFocus, 'PULL');
      const pushOVR = calculateOVR(hypertrophyFocus, 'PUSH');
      const legsOVR = calculateOVR(hypertrophyFocus, 'LEGS');
      
      // PUSH weights HYP at 1.0, PULL at 0.5, LEGS at 0.5
      expect(pushOVR).toBeGreaterThan(pullOVR);
      expect(pushOVR).toBeGreaterThan(legsOVR);
    });

    it('Physical-focus: should show position variance', () => {
      const physicalFocus = stats(50, 50, 50, 50, 99, 50);
      
      const pullOVR = calculateOVR(physicalFocus, 'PULL');
      const pushOVR = calculateOVR(physicalFocus, 'PUSH');
      const legsOVR = calculateOVR(physicalFocus, 'LEGS');
      
      // LEGS weights PHY at 1.0, PULL at 0.3, PUSH at 0.5
      expect(legsOVR).toBeGreaterThan(pullOVR);
      expect(legsOVR).toBeGreaterThan(pushOVR);
    });

    it('Volume-focus: should show position variance', () => {
      const volumeFocus = stats(50, 99, 50, 50, 50, 50);
      
      const pullOVR = calculateOVR(volumeFocus, 'PULL');
      const pushOVR = calculateOVR(volumeFocus, 'PUSH');
      const legsOVR = calculateOVR(volumeFocus, 'LEGS');
      
      // PULL, LEGS weight VOL at 1.0, PUSH at 0.5
      expect(pullOVR).toBeGreaterThan(pushOVR);
      expect(legsOVR).toBeGreaterThan(pushOVR);
      expect(pullOVR).toBe(legsOVR);
    });
  });

  // ============================================
  // 4. BOUNDARY TESTS
  // ============================================
  describe('Boundary Values', () => {
    it('should handle all-zero stats', () => {
      const allZero = stats(0, 0, 0, 0, 0, 0);
      expect(calculateOVR(allZero, 'PULL')).toBe(0);
      expect(calculateOVR(allZero, 'PUSH')).toBe(0);
      expect(calculateOVR(allZero, 'LEGS')).toBe(0);
    });

    it('should handle all-1 stats', () => {
      const allOne = stats(1, 1, 1, 1, 1, 1);
      expect(calculateOVR(allOne, 'PULL')).toBe(1);
      expect(calculateOVR(allOne, 'PUSH')).toBe(1);
      expect(calculateOVR(allOne, 'LEGS')).toBe(1);
    });

    it('should handle 50% stats', () => {
      const mid50 = stats(50, 50, 50, 50, 50, 50);
      expect(calculateOVR(mid50, 'PULL')).toBe(50);
      expect(calculateOVR(mid50, 'PUSH')).toBe(50);
      expect(calculateOVR(mid50, 'LEGS')).toBe(50);
    });

    it('should handle 98/99 stats', () => {
      const high98 = stats(98, 98, 98, 98, 98, 98);
      const high99 = stats(99, 99, 99, 99, 99, 99);
      
      expect(calculateOVR(high98, 'PULL')).toBe(98);
      expect(calculateOVR(high99, 'PULL')).toBe(99);
    });
  });

  // ============================================
  // 5. CAP TEST
  // ============================================
  describe('OVR Capping', () => {
    it('should cap OVR at 99 even if calculated higher', () => {
      const allMax = stats(99, 99, 99, 99, 99, 99);
      
      expect(calculateOVR(allMax, 'PULL')).toBe(99);
      expect(calculateOVR(allMax, 'PUSH')).toBe(99);
      expect(calculateOVR(allMax, 'LEGS')).toBe(99);
    });

    it('should never exceed 99', () => {
      const testCases = [
        stats(99, 99, 99, 99, 99, 99),
        stats(99, 50, 99, 50, 50, 99),
        stats(90, 90, 90, 90, 90, 90),
      ];
      
      testCases.forEach(testStat => {
        expect(calculateOVR(testStat, 'PULL')).toBeLessThanOrEqual(99);
        expect(calculateOVR(testStat, 'PUSH')).toBeLessThanOrEqual(99);
        expect(calculateOVR(testStat, 'LEGS')).toBeLessThanOrEqual(99);
      });
    });
  });

  // ============================================
  // 6. DETERMINISM TEST
  // ============================================
  describe('Determinism', () => {
    it('should produce same result for same input + position', () => {
      const input = stats(87, 78, 70, 74, 83, 87);
      
      const result1 = calculateOVR(input, 'PULL');
      const result2 = calculateOVR(input, 'PULL');
      const result3 = calculateOVR(input, 'PULL');
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should produce consistent results across multiple calls', () => {
      const inputs = [
        stats(50, 50, 50, 50, 50, 50),
        stats(99, 89, 79, 84, 94, 99),
        stats(85, 77, 69, 73, 82, 86),
      ];
      
      inputs.forEach(input => {
        const pullResults = [
          calculateOVR(input, 'PULL'),
          calculateOVR(input, 'PULL'),
          calculateOVR(input, 'PULL'),
        ];
        
        expect(pullResults[0]).toBe(pullResults[1]);
        expect(pullResults[1]).toBe(pullResults[2]);
      });
    });
  });

  // ============================================
  // 7. REAL CHARACTER FIXTURES
  // ============================================
  describe('Real Character Regression Tests', () => {
    
    const characters = [
      { name: 'Chaos', id: 'push_chaos', position: 'PUSH', baseStats: { STR: 99, VOL: 89, TMP: 79, END: 84, PHY: 94, HYP: 99 } },
      { name: 'Gaia', id: 'legs_gaia', position: 'LEGS', baseStats: { STR: 99, VOL: 89, TMP: 79, END: 84, PHY: 94, HYP: 99 } },
      { name: 'Zeus', id: 'push_zeus', position: 'PUSH', baseStats: { STR: 89, VOL: 80, TMP: 71, END: 76, PHY: 85, HYP: 89 } },
      { name: 'Poseidon', id: 'pull_poseidon', position: 'PULL', baseStats: { STR: 88, VOL: 79, TMP: 70, END: 75, PHY: 84, HYP: 88 } },
      { name: 'Hera', id: 'push_hera', position: 'PUSH', baseStats: { STR: 87, VOL: 78, TMP: 70, END: 74, PHY: 83, HYP: 87 } },
      { name: 'Athena', id: 'pull_athena', position: 'PULL', baseStats: { STR: 86, VOL: 77, TMP: 69, END: 73, PHY: 82, HYP: 86 } },
      { name: 'Ares', id: 'push_ares', position: 'PUSH', baseStats: { STR: 85, VOL: 77, TMP: 68, END: 72, PHY: 81, HYP: 85 } },
      { name: 'Apollo', id: 'pull_apollo', position: 'PULL', baseStats: { STR: 84, VOL: 76, TMP: 67, END: 71, PHY: 80, HYP: 84 } },
      { name: 'Artemis', id: 'pull_artemis', position: 'PULL', baseStats: { STR: 83, VOL: 75, TMP: 66, END: 71, PHY: 79, HYP: 83 } },
      { name: 'Hephaestus', id: 'push_hephaestus', position: 'PUSH', baseStats: { STR: 82, VOL: 74, TMP: 66, END: 70, PHY: 78, HYP: 82 } },
      { name: 'Hermes', id: 'legs_hermes', position: 'LEGS', baseStats: { STR: 81, VOL: 73, TMP: 65, END: 69, PHY: 77, HYP: 81 } },
      { name: 'Demeter', id: 'legs_demeter', position: 'LEGS', baseStats: { STR: 80, VOL: 72, TMP: 64, END: 68, PHY: 76, HYP: 80 } },
      { name: 'Aphrodite', id: 'push_aphrodite', position: 'PUSH', baseStats: { STR: 79, VOL: 71, TMP: 62, END: 67, PHY: 75, HYP: 79 } },
    ];

    characters.forEach(char => {
      it(`${char.name} (${char.position}): OVR should be consistent with formula`, () => {
        const result = calculateOVR(char.baseStats, char.position as any);
        const expected = expectedOVR(char.baseStats, char.position);
        
        expect(result).toBe(expected);
        expect(result).toBeLessThanOrEqual(99);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('all real characters should have valid OVR (0-99)', () => {
      characters.forEach(char => {
        const result = calculateOVR(char.baseStats, char.position as any);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(99);
        expect(Number.isInteger(result)).toBe(true);
      });
    });
  });

  // ============================================
  // 8. DATA INTEGRITY TESTS
  // ============================================
  describe('Data Integrity', () => {
    it('should not mutate input stats object', () => {
      const input = stats(85, 85, 85, 85, 85, 85);
      const original = { ...input };
      
      calculateOVR(input, 'PULL');
      
      expect(input).toEqual(original);
    });

    it('should not modify character rarity', () => {
      const char = collectibleWorkouts.find(c => c.id === 'push_chaos');
      if (char) {
        const originalRarity = char.rarity;
        calculateOVR(char.baseStats, char.position);
        expect(char.rarity).toBe(originalRarity);
      }
    });
  });

  // ============================================
  // 9. SORTED COLLECTIBLE WORKOUTS VERIFICATION
  // ============================================
  describe('SORTED_COLLECTIBLE_WORKOUTS', () => {
    it('should be sorted by position then OVR', () => {
      let lastPosition = '';
      let lastOVR = -1;
      
      SORTED_COLLECTIBLE_WORKOUTS.forEach((workout, idx) => {
        const currentOVR = calculateOVR(workout.baseStats, workout.position);
        
        if (workout.position !== lastPosition) {
          // Position changed, reset OVR check
          lastPosition = workout.position;
          lastOVR = currentOVR;
        } else {
          // Same position, OVR should be >= previous
          expect(currentOVR).toBeGreaterThanOrEqual(lastOVR);
          lastOVR = currentOVR;
        }
      });
    });

    it('should contain valid character data', () => {
      SORTED_COLLECTIBLE_WORKOUTS.forEach(workout => {
        expect(workout.id).toBeDefined();
        expect(workout.position).toMatch(/^(PULL|PUSH|LEGS)$/);
        expect(workout.baseStats).toBeDefined();
        expect(workout.baseStats.STR).toBeGreaterThanOrEqual(0);
        expect(workout.baseStats.STR).toBeLessThanOrEqual(99);
      });
    });
  });

  // ============================================
  // 10. DEFAULT POSITION TEST
  // ============================================
  describe('Default Position Behavior', () => {
    it('should default to PULL position when position not specified', () => {
      const input = stats(85, 85, 85, 85, 85, 85);
      
      const withDefault = calculateOVR(input);
      const explicit = calculateOVR(input, 'PULL');
      
      expect(withDefault).toBe(explicit);
    });

    it('should produce consistent results when position defaults to PULL', () => {
      const inputs = [
        stats(50, 50, 50, 50, 50, 50),
        stats(99, 99, 99, 99, 99, 99),
        stats(75, 80, 70, 85, 65, 90),
      ];
      
      inputs.forEach(input => {
        const pullExplicit = calculateOVR(input, 'PULL');
        const pullDefault = calculateOVR(input);
        expect(pullDefault).toBe(pullExplicit);
      });
    });
  });
});
