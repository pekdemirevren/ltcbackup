import { RarityConfig } from '@/types/workout';

export const rarityConfigs: Record<string, RarityConfig> = {
  bronze: {
    tierKey: 'bronze',
    displayName: 'BRONZE',
    shortTag: 'BRZ',
    colors: {
      primary: '#D97941',
      secondary: '#B85C2F',
      accent: '#F0A574',
      glow: 'rgba(217, 121, 65, 0.5)',
    },
  },
  silver: {
    tierKey: 'silver',
    displayName: 'SILVER',
    shortTag: 'SLV',
    colors: {
      primary: '#C5C5C5',
      secondary: '#9E9E9E',
      accent: '#E0E0E0',
      glow: 'rgba(197, 197, 197, 0.5)',
    },
  },
  gold: {
    tierKey: 'gold',
    displayName: 'GOLD',
    shortTag: 'GLD',
    colors: {
      primary: '#F5C842',
      secondary: '#D4A418',
      accent: '#FFE082',
      glow: 'rgba(245, 200, 66, 0.6)',
    },
  },
  pro: {
    tierKey: 'pro',
    displayName: 'PRO',
    shortTag: 'PRO',
    colors: {
      primary: '#00D9FF',
      secondary: '#0099CC',
      accent: '#5CE1FF',
      glow: 'rgba(0, 217, 255, 0.6)',
    },
  },
  legend: {
    tierKey: 'legend',
    displayName: 'LEGEND',
    shortTag: 'LEG',
    colors: {
      primary: '#A855F7',
      secondary: '#7E22CE',
      accent: '#C084FC',
      glow: 'rgba(168, 85, 247, 0.6)',
    },
  },
};