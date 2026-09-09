import { collectibleWorkouts, calculateOVR, getCalculatedOVRFromWorkout } from '../src/constants/collectibleWorkouts';

describe('OVR UI integration / contract', () => {
  it('calculated OVR helper equals calculateOVR for sample workouts', () => {
    const sampleNames = ['Chaos', 'Gaia', 'Hermes'];
    sampleNames.forEach(name => {
      const w = collectibleWorkouts.find(x => x.name === name);
      expect(w).toBeDefined();
      if (!w) return;
      const o1 = calculateOVR(w.baseStats, w.position);
      const o2 = getCalculatedOVRFromWorkout(w);
      expect(o2).toBe(o1);
    });
  });

  it('displayed OVR (helper) is independent from baseLevel', () => {
    const w = collectibleWorkouts.find(x => x.name === 'Chaos');
    expect(w).toBeDefined();
    if (!w) return;
    const originalBaseLevel = w.baseLevel;
    const calc = getCalculatedOVRFromWorkout(w);
    // mutate a copy's baseLevel and ensure calc OVR is unchanged
    const copy = { ...w, baseLevel: originalBaseLevel === 99 ? 50 : originalBaseLevel + 1 };
    const calc2 = getCalculatedOVRFromWorkout(copy);
    expect(calc2).toBe(calc);
  });

  it('changing primary stats affects calculated OVR', () => {
    const w = collectibleWorkouts.find(x => x.name === 'Gaia');
    expect(w).toBeDefined();
    if (!w) return;
    const original = getCalculatedOVRFromWorkout(w);
    const modifiedStats = { ...w.baseStats, STR: Math.max(0, Math.min(99, w.baseStats.STR - 20)) };
    const modified = calculateOVR(modifiedStats, w.position);
    expect(modified).not.toBe(original);
  });

  it('changing position affects position-weighted OVR', () => {
    const w = collectibleWorkouts.find(x => x.name === 'Hermes');
    expect(w).toBeDefined();
    if (!w) return;
    const orig = getCalculatedOVRFromWorkout(w);
    const otherPos = w.position === 'PULL' ? 'PUSH' : 'PULL';
    const changed = calculateOVR(w.baseStats, otherPos as any);
    expect(changed).not.toBe(orig);
  });
});
