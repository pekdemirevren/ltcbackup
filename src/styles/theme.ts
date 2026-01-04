import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- DARK THEME ---
export const colors = { // darkColors'ı doğrudan colors olarak dışa aktarıyoruz
  theme: 'dark',
  background: '#000000',
  text: '#FFFFFF',
  cardBackground: '#101701',
  valueBackground: '#2C2C2E',
  backButtonBackground: 'rgba(255, 255, 255, 0.1)',
  pickerHeaderBorder: '#3A3A3C',
  pickerDoneText: '#0A84FF',
  modalBackground: 'rgba(0,0,0,0.5)',
  playIconText: '#000000',

  time: {
    primary: '#FEE522',
    card: '#2E2A06',
  },
  speed: {
    primary: '#00B7FE',
    card: '#011E29',
  },
  lap: {
    primary: '#F9104E',
    card: '#370411',
  },
  quickStart: {
    primary: '#A3E635',
    card: '#1A2E05',
  },
  weight: {
    primary: '#A655F6',
    card: '#1E0F29',
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
  time: { name: 'history', lib: MaterialCommunityIcons },
  speed: { name: 'speedometer', lib: MaterialCommunityIcons },
  lap: { name: 'timer-outline', lib: MaterialCommunityIcons },
  quickStart: { name: 'check-circle', lib: Feather },
  infinity: { name: 'infinity', lib: MaterialCommunityIcons },
  play: { name: 'play', lib: MaterialCommunityIcons },
  back: { name: 'chevron-left', lib: Feather },
  settings: { name: 'settings', lib: Feather },
  customize: { name: 'sliders', lib: Feather },
  theme: { name: 'sun', lib: Feather }, // Aydınlık mod için
};

// Renkleri ve İkonları tek bir yerden export et
export const Theme = { // Theme objesini güncelliyoruz
  dark: colors, // Artık sadece 'dark' temamız var ve adı 'colors'
  Icons,
};

export default Theme;