import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MainCard, MainCardState } from '../types/mainCard';
import { getMainCardState } from '../utils/MainCardEngine';
import { FUTShield } from './FUTShield';
import Svg, { Path, G, Rect, Pattern } from 'react-native-svg';
import AphroditeIcon from '../assets/icons/aphrodite';
import { collectibleRarityColors, Rarity } from '../constants/collectibleWorkouts';
import { MythologyHierarchy } from './MythologyHierarchy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RarityTexture = ({ rarity, color }: { rarity: string, color: string }) => {
    const upperHeight = "55%";
    const lowerRarity = rarity.toLowerCase();

    if (lowerRarity === 'gold') {
        return (
            <Svg height={upperHeight} width="100%" style={{ position: 'absolute' }}>
                <G opacity="0.15">
                    <Path d="M100 160 L250 50" stroke={color} strokeWidth="15" opacity="0.3" />
                    <Path d="M100 160 L250 250" stroke={color} strokeWidth="15" opacity="0.3" />
                    <Path d="M100 160 L250 160" stroke={color} strokeWidth="20" opacity="0.4" />
                </G>
            </Svg>
        );
    }
    return null;
};

interface MainCardCardNewProps {
    card: MainCard;
    fullWidth?: boolean;
}

export const MainCardCardNew: React.FC<MainCardCardNewProps> = ({
    card,
    fullWidth = true,
}) => {
    const navigation = useNavigation<any>();
    const [state, setState] = useState<MainCardState | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const loadState = async () => {
                const s = await getMainCardState(card.id);
                if (isActive) {
                    setState(s);
                }
            };

            void loadState();
            return () => {
                isActive = false;
            };
        }, [card.id])
    );

    const rarityConfig = (collectibleRarityColors as any)[card.rarity] || collectibleRarityColors.GOLD;
    // @ts-ignore
    const castRarity = card.rarity as Rarity;
    const ovr = state ? Math.round(Object.values(state.gains).reduce((a, b) => a + b, 0)) : 0;

    const handleCardPress = () => {
        navigation.navigate('MainCardDetail', {
            cardId: card.id,
        });
    };

    const cardWidth = fullWidth ? SCREEN_WIDTH - 40 : (SCREEN_WIDTH - 52) / 2;
    const cardHeight = cardWidth * 1.5;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCardPress}
            style={styles.cardContainer}
        >
            <FUTShield
                width={cardWidth}
                height={cardHeight}
                fill={rarityConfig.secondary}
                bottomFill={rarityConfig.secondary + 'CC'}
                splitPercentage={55}
                rarity={card.rarity as any}
            >
                <View style={styles.cardContent}>
                    <RarityTexture rarity={card.rarity} color={rarityConfig.patternColor} />

                    <View style={styles.topSection}>
                        <View style={styles.topSide}>
                            <Text style={[styles.ovrText, { color: rarityConfig.text }]}>{ovr || '--'}</Text>
                            <Text style={[styles.themeText, { color: rarityConfig.text }]}>
                                {card.theme}
                            </Text>
                        </View>

                        <View style={styles.symbolContainer}>
                            <MythologyHierarchy
                                primaryIconId={card.primaryIconId}
                                secondaryIconIds={card.secondaryIconId ? [card.secondaryIconId] : []}
                                rarity={card.rarity as any}
                                epithet={card.primaryEpithetByTier?.[card.rarity]}
                                color={rarityConfig.text}
                                useCropped={true}
                            />
                        </View>
                    </View>

                    <View style={styles.nameSection}>
                        <Text style={[styles.primaryName, { color: rarityConfig.text }]}>
                            {card.primary.toUpperCase()}
                        </Text>
                        <View style={[styles.nameDivider, { backgroundColor: rarityConfig.text, opacity: 0.3 }]} />
                    </View>

                    <View style={styles.statsSection}>
                        <View style={styles.statsGrid}>
                            {state && (Object.entries(state.gains) as [string, number][]).map(([key, val]) => (
                                <View key={key} style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: rarityConfig.text }]}>{Math.round(val)}</Text>
                                    <Text style={[styles.statLabel, { color: rarityConfig.text }]}>{key}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.bottomSection}>
                        <Text style={[styles.runsText, { color: rarityConfig.text }]}>
                            RUNS: {state?.level || 0}/{card.requiredRuns}
                        </Text>
                    </View>
                </View>
            </FUTShield>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 20,
        alignSelf: 'center',
    },
    cardContent: {
        flex: 1,
        padding: 15,
    },
    topSection: {
        flexDirection: 'row',
        height: '45%',
    },
    topSide: {
        alignItems: 'center',
        paddingTop: 10,
        width: 50,
    },
    ovrText: {
        fontSize: 32,
        fontWeight: '900',
    },
    themeText: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: -5,
    },
    symbolContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 20,
    },
    nameSection: {
        alignItems: 'center',
        marginTop: 5,
    },
    primaryName: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    nameDivider: {
        height: 1,
        width: '80%',
        marginTop: 4,
    },
    statsSection: {
        marginTop: 10,
        paddingHorizontal: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '33%',
        paddingVertical: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '800',
        marginRight: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.8,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    runsText: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.7,
    },
});
