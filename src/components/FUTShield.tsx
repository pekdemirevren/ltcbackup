import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, G, Rect, Line, Defs, ClipPath, RadialGradient, Stop, LinearGradient } from 'react-native-svg';

interface FUTShieldProps {
    width: number;
    height: number;
    fill?: string;
    bottomFill?: string;
    splitPercentage?: number;
    stroke?: string;
    strokeWidth?: number;
    children?: React.ReactNode;
    style?: ViewStyle;
    rarity?: 'bronze' | 'silver' | 'gold' | 'legend' | 'titan' | 'icon' | 'hero' | 'primordial' | 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGEND' | 'TITAN' | 'ICON' | 'HERO' | 'PRIMORDIAL' | 'creature' | 'mortal' | 'underworld' | 'CREATURE' | 'MORTAL' | 'UNDERWORLD';
}

// Rarity-based color configurations for premium FIFA card look
const rarityColors = {
    bronze: {
        primary: '#DC9464',
        secondary: '#B85C2F',
        accent: '#F0A574',
        dark: '#8B4513',
        sunburst: '#E8A060',
    },
    silver: {
        primary: '#9A9FA9',
        secondary: '#7F848E',
        accent: '#D1D5DB',
        dark: '#4B5563',
        sunburst: '#BCC2CD',
    },
    gold: {
        primary: '#F5C842',
        secondary: '#D4A418',
        accent: '#FFE082',
        dark: '#B8860B',
        sunburst: '#E8D060',
    },
    legend: {
        primary: '#A855F7',
        secondary: '#9333EA',
        accent: '#C084FC',
        dark: '#581C87',
        sunburst: '#E9D5FF',
    },
    titan: {
        primary: '#D1D5DB',
        secondary: '#9CA3AF',
        accent: '#E5E7EB',
        dark: '#4B5563',
        sunburst: '#D1D5DB',
    },
    icon: {
        primary: '#FFFFFF',
        secondary: '#E0E0E0',
        accent: '#C0C0C0',
        dark: '#404040',
        sunburst: '#F0F0F0',
    },
    hero: {
        primary: '#E5B288',
        secondary: '#C68945',
        accent: '#F2D2B5',
        dark: '#7C471B',
        sunburst: '#D99D6B',
    },
    primordial: {
        primary: '#FFFFFF',
        secondary: '#E5E7EB',
        accent: '#F3F4F6',
        dark: '#374151',
        sunburst: '#F9FAFB',
    },
    god: {
        primary: '#F5C842',
        secondary: '#D4A418',
        accent: '#FFE082',
        dark: '#B8860B',
        sunburst: '#E8D060',
    },
    goddess: {
        primary: '#F5C842',
        secondary: '#D4A418',
        accent: '#FFE082',
        dark: '#B8860B',
        sunburst: '#E8D060',
    },
    divine: {
        primary: '#F5C842',
        secondary: '#D4A418',
        accent: '#FFE082',
        dark: '#B8860B',
        sunburst: '#E8D060',
    },
    creature: {
        primary: '#8B0000',
        secondary: '#660000',
        accent: '#FF4D4D',
        dark: '#330000',
        sunburst: '#A52A2A',
    },
    mortal: {
        primary: '#DC9464',
        secondary: '#B85C2F',
        accent: '#F0A574',
        dark: '#8B4513',
        sunburst: '#E8A060',
    },
    underworld: {
        primary: '#FFFFFF',
        secondary: '#FFF5E1',
        accent: '#FFD700',
        dark: '#B8860B',
        sunburst: '#FFFACD',
    },
};

/**
 * FUTShield - Premium FIFA-Style 3D Card
 * Features radial sunburst effect, metallic gradients, and enhanced 3D depth
 */
export const FUTShield: React.FC<FUTShieldProps> = ({
    width,
    height,
    fill,
    bottomFill,
    stroke = 'transparent',
    strokeWidth = 0,
    children,
    style,
    rarity = 'gold',
}) => {
    const normalizedRarity = (rarity.toLowerCase() as keyof typeof rarityColors);
    const colors = rarityColors[normalizedRarity] || rarityColors.gold;
    const mainFill = fill || colors.primary;
    const bottomColor = bottomFill || colors.secondary;

    // The classic premium rounded shield path (wider shoulders, +10 bottom radius expansion)
    const shieldD = "M0, 52 Q28, 52 28, 38 Q100, 5 172, 38 Q172, 52 200, 52 L200,240 Q200,268 140,268 Q120,268 100,280 Q80,268 60,268 Q0,268 0,240 Z";

    // Cinematic Lighting Perspective (Flat Base with prominent light source)
    const shiftX = 0;
    const shiftY = 0;

    // Pattern Clipping Inset - Ensures rays stop at the highlight border
    // Pattern Clipping Inset - Ensures rays stop strictly inside the 6px light/shadow borders (+10 bottom radius expansion)
    // Pattern Clipping Inset - Truncated at y=153 to keep sunburst in the top half only (moved 10px down)
    const innerShieldD = "M6, 58 Q28, 58 28, 44 Q100, 11 172, 44 Q172, 58 188, 58 L188,153 L6,153 Z";
    // Generate sunburst rays
    const generateSunburstRays = () => {
        const rays = [];
        const centerX = 0;
        const centerY = 153; // Aligned with the pattern clip for perfect symmetry (moved 10px down)
        const rayCount = 24;
        const innerRadius = 10;
        const outerRadius = 280;

        for (let i = 0; i < rayCount; i++) {
            const angle1 = (i * 2 * Math.PI) / rayCount;
            const angle2 = ((i + 0.3) * 2 * Math.PI) / rayCount;

            const x1 = centerX + innerRadius * Math.cos(angle1);
            const y1 = centerY + innerRadius * Math.sin(angle1);
            const x2 = centerX + outerRadius * Math.cos(angle1);
            const y2 = centerY + outerRadius * Math.sin(angle1);
            const x3 = centerX + outerRadius * Math.cos(angle2);
            const y3 = centerY + outerRadius * Math.sin(angle2);
            const x4 = centerX + innerRadius * Math.cos(angle2);
            const y4 = centerY + innerRadius * Math.sin(angle2);

            // Slight offset for shadow to create depth on light cards
            const shadowOffset = 0.5;

            rays.push(
                <G key={`ray-group-${i}`}>
                    {/* Dark shadow layer (Bottom-Right offset) */}
                    <Path
                        d={`M${x1 + shadowOffset},${y1 + shadowOffset} L${x2 + shadowOffset},${y2 + shadowOffset} L${x3 + shadowOffset},${y3 + shadowOffset} L${x4 + shadowOffset},${y4 + shadowOffset} Z`}
                        fill="#000"
                        opacity={0.06}
                    />
                    {/* Light highlight layer (Top-Left offset) - ADDS BEVEL EFFECT */}
                    <Path
                        d={`M${x1 - shadowOffset},${y1 - shadowOffset} L${x2 - shadowOffset},${y2 - shadowOffset} L${x3 - shadowOffset},${y3 - shadowOffset} L${x4 - shadowOffset},${y4 - shadowOffset} Z`}
                        fill="#FFF"
                        opacity={0.12}
                    />
                    {/* Primary light/color ray */}
                    <Path
                        d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z`}
                        fill={colors.sunburst}
                        opacity={i % 2 === 0 ? 0.15 : 0.08}
                    />
                </G>
            );
        }
        return rays;
    };

    return (
        <View style={[{ width, height }, style]}>
            <Svg
                width={width}
                height={height}
                viewBox="-5 0 210 290"
                style={StyleSheet.absoluteFill}
            >
                <Defs>
                    <ClipPath id="shieldClip">
                        <Path d={shieldD} />
                    </ClipPath>

                    <ClipPath id="patternClip">
                        <Path d={innerShieldD} />
                    </ClipPath>

                    {/* Top-Left to Bottom-Right diagonal material gradient for realistic lighting */}
                    <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
                        <Stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
                    </LinearGradient>

                    {/* Top Dome Rim Gradient - Softened start/end for seamless notch integration */}
                    <LinearGradient id="topRimLightGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={colors.accent} stopOpacity="0" />
                        <Stop offset="15%" stopColor={colors.accent} stopOpacity="0.3" />
                        <Stop offset="50%" stopColor={colors.accent} stopOpacity="0.6" />
                        <Stop offset="85%" stopColor={colors.accent} stopOpacity="0.8" />
                        <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                    </LinearGradient>

                    {/* Unified Depth Rim Gradient - Solid at the top-right, soft fade-in at top-left start */}
                    <LinearGradient id="rightDepthRimGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={colors.dark} stopOpacity="0.25" />
                        <Stop offset="30%" stopColor={colors.dark} stopOpacity="0.25" />
                        <Stop offset="88%" stopColor={colors.dark} stopOpacity="0" />
                        <Stop offset="93%" stopColor={colors.dark} stopOpacity="0.2" />
                        <Stop offset="95%" stopColor={colors.dark} stopOpacity="0" />
                    </LinearGradient>

                    {/* Unified Rim Cast Shadow Gradient - Solid at the top-right, soft fade-in at top-left start */}
                    <LinearGradient id="rightRimShadowGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0.2" />
                        <Stop offset="35%" stopColor="#000" stopOpacity="0.2" />
                        <Stop offset="88%" stopColor="#000" stopOpacity="0" />
                        <Stop offset="93%" stopColor="#000" stopOpacity="0.15" />
                        <Stop offset="95%" stopColor="#000" stopOpacity="0" />
                    </LinearGradient>

                    {/* Left Side Rim Gradient - Ultra-soft fade-out into the corner (80%->100%) */}
                    <LinearGradient id="leftRimLightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={colors.accent} stopOpacity="0" />
                        <Stop offset="5%" stopColor={colors.accent} stopOpacity="0.8" />
                        <Stop offset="80%" stopColor={colors.accent} stopOpacity="0.8" />
                        <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                    </LinearGradient>

                    {/* Right Side Rim Gradient - Soft fade-in at the top notch (0%->10%) and fade-out at bottom curve (80%->95%) */}
                    <LinearGradient id="rightRimLightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={colors.accent} stopOpacity="0" />
                        <Stop offset="10%" stopColor={colors.accent} stopOpacity="0.6" />
                        <Stop offset="80%" stopColor={colors.accent} stopOpacity="0.6" />
                        <Stop offset="95%" stopColor={colors.accent} stopOpacity="0" />
                    </LinearGradient>

                    {/* Light-Occluded Depth Rim Gradient - Unified for bottom reach */}
                    <LinearGradient id="bottomDepthRimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={colors.dark} stopOpacity="0.6" />
                        <Stop offset="100%" stopColor={colors.dark} stopOpacity="0.6" />
                    </LinearGradient>

                    {/* Sharp Inner Contour Gradient - Solid at the top-right, soft fade-in at top-left start */}
                    <LinearGradient id="sharpDarkBorderGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={colors.dark} stopOpacity="0.15" />
                        <Stop offset="20%" stopColor={colors.dark} stopOpacity="0.1" />
                        <Stop offset="85%" stopColor={colors.dark} stopOpacity="0" />
                    </LinearGradient>

                    {/* Midpoint Strategic Dividing Beam - Ultra-clean silver for titan cards, theme accent for others */}
                    <LinearGradient id="midpointBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
                        <Stop offset="50%" stopColor={colors.accent} stopOpacity="0.8" />
                        <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.8" />
                    </LinearGradient>

                    {/* Diagonal Shadow Overlay - Adjusted to TL-to-BR to keep top-left dome clear */}
                    <LinearGradient id="diagonalShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.secondary} stopOpacity="0" />
                        <Stop offset="45%" stopColor={colors.secondary} stopOpacity="0" />
                        <Stop offset="50%" stopColor={colors.dark} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={colors.dark} stopOpacity="0.6" />
                    </LinearGradient>

                    {/* Left Shoulder Pivot Glow - Reduced opacity for subtle transition */}
                    <RadialGradient id="pivotGlow" cx="0" cy="52" r="20" gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.6" />
                        <Stop offset="50%" stopColor={colors.accent} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                    </RadialGradient>

                    {/* Right Shoulder Pivot Glow - Restored to match left symmetry */}
                    <RadialGradient id="rightPivotGlow" cx="200" cy="52" r="20" gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.6" />
                        <Stop offset="50%" stopColor={colors.accent} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                    </RadialGradient>

                    {/* Top Rim Cast Shadow - Softened start to blend into the notch curvature */}
                    <LinearGradient id="topRimShadow" x1="100%" y1="0%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0" />
                        <Stop offset="15%" stopColor="#000" stopOpacity="0.2" />
                        <Stop offset="40%" stopColor="#000" stopOpacity="0" />
                    </LinearGradient>

                    {/* Unified Bottom Rim Shadow - Extended soft entry (0%->20%) to blend with left light */}
                    <LinearGradient id="bottomRimShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0" />
                        <Stop offset="20%" stopColor="#000" stopOpacity="0.6" />
                        <Stop offset="45%" stopColor="#000" stopOpacity="0.6" />
                        <Stop offset="50%" stopColor="#000" stopOpacity="0.2" />
                        <Stop offset="55%" stopColor="#000" stopOpacity="0.6" />
                        <Stop offset="95%" stopColor="#000" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </LinearGradient>

                    {/* Right Notch Thickness Shadow Gradient - Balanced fade-in and high-quality transition */}
                    <LinearGradient id="rightNotchShadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0" />
                        <Stop offset="20%" stopColor="#000" stopOpacity="0.5" />
                        <Stop offset="80%" stopColor="#000" stopOpacity="0.5" />
                        <Stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </LinearGradient>

                    {/* Left Side Shadow Gradient - Extended fade-in (0%->40%) to eliminate blunt cut at corner start */}
                    <LinearGradient id="leftRimShadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0" />
                        <Stop offset="40%" stopColor="#000" stopOpacity="0.6" />
                        <Stop offset="85%" stopColor="#000" stopOpacity="0.6" />
                        <Stop offset="95%" stopColor="#000" stopOpacity="0" />
                    </LinearGradient>
                </Defs>

                {/* LAYER 1: Main Card Material Surface (Flat Base) with Diagonal Shadow Overlay */}
                <G clipPath="url(#shieldClip)">
                    <Rect x="0" y="0" width="200" height="286" fill="url(#cardGradient)" />
                    <Rect x="0" y="0" width="200" height="286" fill="url(#diagonalShadow)" />

                    {/* Sunburst rays overlay - Single Focused Layer */}
                    <G clipPath="url(#patternClip)">
                        <G opacity={0.7} >
                            {generateSunburstRays()}
                        </G>
                    </G>

                    {/* Midpoint Strategic Dividing Beam - Physical Integrity Center Detail */}
                    <Path
                        d="M0,163 L200,163"
                        stroke="url(#midpointBeamGradient)"
                        strokeWidth="4"
                        opacity={0.6}
                    />

                    {/* LAYER 2: SHADOWS & DEPTH EFFECTS (Rendered first) */}
                    {/* Top Rim Cast Shadow - Restricted to dome to avoid covering shoulders */}
                    {/* Top Rim Cast Shadow - Spans across dome and both notches for depth symmetry */}
                    <Path
                        d="M0,52 Q28,52 28,38 Q100,5 172,38 Q172,52 200,52"
                        fill="none"
                        stroke="url(#topRimShadow)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* Unified BOTTOM RIM SHADOW - Merged BL corner and V-center for seamless flow */}
                    <Path
                        d="M0,240 Q0,268 60,268 Q80,268 100,280 Q120,268 140,268 Q200,268 200,240"
                        fill="none"
                        stroke="url(#bottomRimShadow)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* UNIFIED DARK DEPTH LINE - Silhouette-perfect path (M0,240) with visual 5px trim via gradient */}
                    <Path
                        d="M0,240 Q0,268 60,268 Q80,268 100,280 Q120,268 140,268 Q200,268 200,240 L200,52"
                        fill="none"
                        stroke="url(#rightDepthRimGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* UNIFIED CAST SHADOW LINE - Physical depth overlay aligned with primary silhouette */}
                    <Path
                        d="M0,240 Q0,268 60,268 Q80,268 100,280 Q120,268 140,268 Q200,268 200,240 L200,52"
                        fill="none"
                        stroke="url(#rightRimShadowGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* UNIFIED SHARP INNER DEFINER - High-definition outline aligned with primary silhouette */}
                    <Path
                        d="M0,240 Q0,268 60,268 Q80,268 100,280 Q120,268 140,268 Q200,268 200,240 L200,52"
                        fill="none"
                        stroke="url(#sharpDarkBorderGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity={0.4}
                    />

                    {/* RIGHT NOTCH THICKNESS SHADOW - Added for final depth balance */}
                    <Path
                        d="M172,38 Q172,52 200,52"
                        fill="none"
                        stroke="url(#rightNotchShadowGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* LAYER 3: RIM LIGHTS (Clean Silhouette) */}
                    {/* LAYER 3: RIM LIGHTS (Clean Silhouette) */}
                    {/* Part A: Main Dome Highlight + Both Notches for Symmetry */}
                    <Path
                        d="M0,52 Q28,52 28,38 Q100,5 172,38 Q172,52 200,52"
                        fill="none"
                        stroke="url(#topRimLightGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* Part B: Left Vertical Highlight (4px) - Extends slightly into curve for soft blend */}
                    <Path
                        d="M0,52 L0,240 Q0,268 60,268"
                        fill="none"
                        stroke="url(#leftRimLightGradient)"
                        strokeWidth="4"
                    />

                    {/* Part D: Right Vertical Rim (2px) - Contours from notch to bottom curve */}
                    <Path
                        d="M200,52 L200,240 Q200,268 140,268"
                        fill="none"
                        stroke="url(#rightRimLightGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </G>
            </Svg>

            {/* Content Container - Offset to match the shifted face */}
            <View style={[
                StyleSheet.absoluteFill,
                {
                    padding: width * 0.045,
                    transform: [
                        { translateX: (width / 200) * shiftX },
                        { translateY: (height / 285) * shiftY }
                    ],
                    zIndex: 100, // Enforce content to stay on top
                    elevation: 10, // Shadow for Android/layered feel
                }
            ]}>
                {children}
            </View>
        </View>
    );
};
