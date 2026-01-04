import React, { useState, useContext, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from './Theme';
import { getStyles } from './SettingsScreen.styles';
import { ThemeContext } from "./ThemeContext";

export function SettingsScreen({ 
  navigation,
  onBack = () => {},
  onSave = () => {},
  onQuickStart,
  startTimerWithCurrentSettings = () => {},
  onNavigateTo, // Bu prop artık kullanılmayacak ama uyumluluk için kalabilir
  // Değerleri anında App.js'e kaydetmek için yeni prop'lar
  onGreenTimeChange,
  onRedTimeChange,
  onGreenSpeedChange,
  onRedSpeedChange,
  onGreenRepsChange,
  onRedRepsChange,
  onResetGreenTime,
  onResetRedTime,
  onResetElapsedTime,
  // Context değerlerini prop olarak al
  totalGreenTime: propTotalGreenTime,
  totalRedTime: propTotalRedTime,
  totalElapsedTime: propTotalElapsedTime,
  currentGreenCountdownSpeed: propGreenCountdownSpeed,
  currentRedCountdownSpeed: propRedCountdownSpeed,
  currentGreenReps: propGreenReps,
  currentRedReps: propRedReps,
  currentGreenTime: propGreenTime,
  currentRedTime: propRedTime,
  currentInfiniteLoopTime: propInfiniteLoopTime,
  currentInfiniteSpeed: propInfiniteSpeed,
  colors: propColors // colors prop olarak al
} = {}) {
  // Tüm callback'ler props olarak geliyor
  const handleQuickStart = onQuickStart;

  // Diğer callback'ler props olarak geliyor
  const setGreenTime = onGreenTimeChange;
  const setRestTime = onRedTimeChange;
  const setGreenCountdownSpeed = onGreenSpeedChange;
  const setRedCountdownSpeed = onRedSpeedChange;
  const setGreenReps = onGreenRepsChange;
  const setRedReps = onRedRepsChange;
  const resetGreenTime = onResetGreenTime;
  const resetRedTime = onResetRedTime;
  const resetElapsedTime = onResetElapsedTime;

  // Props'lardan değerleri al
  const totalGreenTime = propTotalGreenTime;
  const totalRedTime = propTotalRedTime;
  const totalElapsedTime = propTotalElapsedTime;
  const currentGreenCountdownSpeed = propGreenCountdownSpeed;
  const currentRedCountdownSpeed = propRedCountdownSpeed;
  const currentGreenReps = propGreenReps;
  const currentRedReps = propRedReps;
  const currentGreenTime = propGreenTime;
  const currentRedTime = propRedTime;
  const currentInfiniteLoopTime = propInfiniteLoopTime;
  const currentInfiniteSpeed = propInfiniteSpeed ? propInfiniteSpeed / 1000 : 1; // milisaniyeden saniyeye çevir

  // Use ThemeContext for colors instead of prop
  const { colors } = useContext(ThemeContext);
  const styles = getStyles(colors);

  // --- TASLAK STATE'LER ---
  // App.js'ten gelen props'ları kullanarak bu ekranın kendi geçici state'ini oluştur.
  // Loop için ayrı state tutmuyoruz, doğrudan prop kullanıyoruz
  const [localGreenTime, setLocalGreenTime] = useState(currentGreenTime || '30');
  const [localRedTime, setLocalRedTime] = useState(currentRedTime || '30');
  const [localGreenReps, setLocalGreenReps] = useState(String(currentGreenReps || '3')); // String olarak başlat
  const [localRedReps, setLocalRedReps] = useState(String(currentRedReps || '3')); // String olarak başlat
  const [greenSpeed, setGreenSpeed] = useState((currentGreenCountdownSpeed || 1000) / 1000); // saniyeye çevir
  const [redSpeed, setRedSpeed] = useState((currentRedCountdownSpeed || 1000) / 1000); // saniyeye çevir

  // App.js'ten gelen prop'lar değiştiğinde bu ekranın kendi state'ini güncelle.
  // Bu, alt sayfalardan geri dönüldüğünde değerlerin doğru görünmesini sağlar.
  useEffect(() => {
    setLocalGreenTime(currentGreenTime || '30');
    setLocalRedTime(currentRedTime || '30');
    setLocalGreenReps(String(currentGreenReps || '3'));
    setLocalRedReps(String(currentRedReps || '3'));
    setGreenSpeed((currentGreenCountdownSpeed || 1000) / 1000);
    setRedSpeed((currentRedCountdownSpeed || 1000) / 1000);
  }, [currentGreenTime, currentRedTime, currentGreenReps, currentRedReps, currentGreenCountdownSpeed, currentRedCountdownSpeed]);

  // Geri butonunun işlevselliğini yönetir.
  const handleBack = () => {
    // Ana menüdeysek, React Navigation'ın geri fonksiyonunu çağır.
    onBack();
  };

  const handleSave = () => {
    // Bu ekranda değiştirilen "taslak" ayarları tek bir obje olarak topla.
    // Ayarlar zaten anlık olarak kaydedildiği için, bu buton sadece
    // özel döngü ayarlarıyla zamanlayıcıyı başlatır.
    onSave();
  };

  const [modalVisible, setModalVisible] = useState(false);
  // Nested modals for each card
  const [loopModalVisible, setLoopModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [speedModalVisible, setSpeedModalVisible] = useState(false);
  const [lapModalVisible, setLapModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}> 
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customize Workout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loop Card: doğrudan ayar ekranına yönlendir */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.quickStart.card }]} onPress={() => navigation.navigate('LoopSelection', { workoutId: 'default', workoutName: 'Default Loop', onSave })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.infinity.lib name={Theme.Icons.infinity.name} size={32} color={colors.quickStart.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Loop</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, false)} activeOpacity={0.7}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

  {/* Time Card: doğrudan ayar ekranına yönlendir */}
  <TouchableOpacity style={[styles.card, { backgroundColor: colors.time.card }]} onPress={() => navigation.navigate('TimeSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, onSave, workoutId: 'default' })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Time</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.time.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, true)} activeOpacity={0.7}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

  {/* Speed Card: doğrudan ayar ekranına yönlendir */}
  <TouchableOpacity style={[styles.card, { backgroundColor: colors.speed.card }]} onPress={() => navigation.navigate('SpeedSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, onSave, workoutId: 'default' })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            {/* Use custom SpeedIcon SVG */}
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 36, height: 36, color: colors.speed.primary })
            ) : null}
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Speed</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.speed.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, true)} activeOpacity={0.7}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

  {/* Lap Card: doğrudan ayar ekranına yönlendir */}
  <TouchableOpacity style={[styles.card, { backgroundColor: colors.lap.card }]} onPress={() => navigation.navigate('LapSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, onSave, workoutId: 'default' })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib name={Theme.Icons.lap.name} size={32} color={colors.lap.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Lap</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.lap.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, true)} activeOpacity={0.7}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Plus icon below last card */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#1B1C1E',
              borderRadius: 23,
              width: 47,
              height: 47,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 4,
            }}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={32} color={colors.quickStart.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal with four cards: Loop, Time, Speed, Lap */}
      <Modal visible={modalVisible} animationType="slide" transparent>
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' }}>
    <View style={{ flex: 1, backgroundColor: '#1B1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: 320, marginTop: 48 }}>
            <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8, justifyContent: 'center' }}>
              <Text style={{ color: '#e5e5e5', fontSize: 19, fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'center' }}>Add Workout</Text>
            </View>
            {/* Loop Card */}
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.quickStart.card, marginBottom: 8, marginTop: 32 }]} onPress={() => navigation.navigate('LoopSelection', { workoutId: 'default', workoutName: 'Default Loop', onSave })} activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                <Theme.Icons.infinity.lib name={Theme.Icons.infinity.name} size={32} color={colors.quickStart.primary} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Loop</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, false)} activeOpacity={0.7}>
                <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Time Card (modal) */}
            <TouchableOpacity style={[styles.card, { backgroundColor: '#45401E', marginBottom: 8 }]} onPress={() => navigation.navigate('TimeSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, onSave, workoutId: 'default' })} activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Time</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.time.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, true)} activeOpacity={0.7}>
                <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Speed Card (modal) */}
            <TouchableOpacity style={[styles.card, { backgroundColor: '#173542', marginBottom: 8 }]} onPress={() => navigation.navigate('SpeedSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, onSave, workoutId: 'default' })} activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                {/* Use custom SpeedIcon SVG */}
                {require('./assets/icons/speed.jsx').default ? (
                  require('./assets/icons/speed.jsx').default({ width: 32, height: 32, color: colors.speed.primary })
                ) : null}
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Speed</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.speed.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, true)} activeOpacity={0.7}>
                <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Lap Card (modal) */}
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.lap.card }]} onPress={() => navigation.navigate('LapSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, onSave, workoutId: 'default' })} activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                <Theme.Icons.lap.lib name={Theme.Icons.lap.name} size={32} color={colors.lap.primary} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Lap</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.lap.primary }]} onPress={() => startTimerWithCurrentSettings(navigation, true)} activeOpacity={0.7}>
                <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Close button - top left corner */}
            <View style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#222',
                  borderRadius: 22,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 0.8,
                  borderColor: 'rgba(255,255,255,0.18)',
                  elevation: 4,
                }}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={28.8} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
