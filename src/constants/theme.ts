import LapIcon from '../assets/icons/LapIcon';
import PlayIcon from '../assets/icons/PlayIcon';
import LoopIcon from '../assets/icons/LoopIcon';
import TimeIcon from '../assets/icons/TimeIcon';
import BackIcon from '../assets/icons/BackIcon';
import LegPressIcon from '../assets/icons/LegPressIcon';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

// --- DARK THEME ---
export const colors = { // darkColors'ı doğrudan colors olarak dışa aktarıyoruz
  theme: 'dark',
  background: '#000000',
  text: '#FFFFFF',
  cardBackground: '#111111',
  valueBackground: '#3C3C3E',
  backButtonBackground: 'rgba(255, 255, 255, 0.1)',
  pickerHeaderBorder: '#3A3A3C',
  pickerDoneText: '#0A84FF',
  modalBackground: 'rgba(0,0,0,0.5)',
  playIconText: '#000000',

  time: {
    primary: '#FEE522',
    card: '#2E2A06',
    cardModal: '#45401F',
  },
  speed: {
    primary: '#00B7FE',
    card: '#011E29',
    cardModal: '#183542',
  },
  lap: {
    primary: '#F9104E',
    card: '#370411',
    cardModal: '#4D1929',
  },
  weight: {
    primary: '#A358DF',
    card: '#2A1B3D',
    cardModal: '#4A2C6B',
  },
  quickStart: {
    primary: '#A3E635',
    card: '#1A2E05',
  },
  saveButtonGradient: ['#FACC15', '#EAB308'],
  settingsIconGradient: ['#6366f1', '#8b5cf6'],

  led: {
    green: '#00FF00',
    red: '#FF0000',
    white: '#FFFFFF',
  }
};

export const Icons = {
  time: { lib: TimeIcon },
  speed: { name: 'speedometer', lib: MaterialCommunityIcons },
  lap: { lib: LapIcon },
  weight: { name: 'weight-kilogram', lib: MaterialCommunityIcons },
  quickStart: { name: 'check-circle', lib: Feather },
  infinity: { lib: LoopIcon },
  play: { lib: PlayIcon },
  back: { lib: BackIcon },
  settings: { name: 'settings', lib: Feather },
  customize: { name: 'sliders', lib: Feather },
  theme: { name: 'sun', lib: Feather }, // Aydınlık mod için
  legPress: { lib: LegPressIcon },
};

// Renkleri ve İkonları tek bir yerden export et
export const Theme = { // Theme objesini güncelliyoruz
  dark: colors, // Artık sadece 'dark' temamız var ve adı 'colors'
  Icons,
};

export default Theme;