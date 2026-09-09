import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { calculateCalories } from '../utils/CalorieCalculator';
import { parseStoredBodyWeight, DEFAULT_BODY_WEIGHT_KG } from '../constants/bodyWeight';

type SummaryScreenProps = StackScreenProps<RootStackParamList, 'SummaryOverview'>;

export default function SummaryScreen(_props: SummaryScreenProps) {
  const [dailyEnergy, setDailyEnergy] = useState<number | null>(null);
  const [bodyWeightKg, setBodyWeightKg] = useState<number>(DEFAULT_BODY_WEIGHT_KG);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('userBodyWeight');
        const parsed = parseStoredBodyWeight(stored);
        setBodyWeightKg(parsed);

        const kcal = calculateCalories({
          workoutId: 'outdoor_walk',
          durationSeconds: 30 * 60,
          bodyWeightKg: parsed,
          liftedWeightKg: 0,
          reps: 0,
        });
        setDailyEnergy(kcal);
      } catch (e) {
        console.warn('SummaryScreen: failed to load data', e);
      }
    };

    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.label}>Body weight</Text>
        <Text style={styles.value}>{bodyWeightKg} kg</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Estimated energy (example)</Text>
        <Text style={styles.value}>{dailyEnergy ?? '—'} kcal</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#000',
    minHeight: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
        <Text style={styles.title}>Summary</Text>
        <DailyWorkoutWidget
          workoutDay={todaysWorkoutDay}
          workoutIds={todaysWorkoutIds}
          currentDay={getCurrentDayNumber()}
          totalDays={7}
          onPress={() => {
            if (todaysWorkoutDay) {ss={() => {
              if (todaysEventId) {sEditing) navigation.navigate('DailySummaryDetail');
                // If we have a specific event, go to its detail view
                navigation.navigate('WorkoutEventDetail', {
                  eventId: todaysEventId,
                  date: new Date().toISOString()
                });m: 12 }]}>Activity Ring</Text>
              } else {
                // Determine header title based on workoutDay or fallbackr}>
                // If it's a manual schedule without an event ID, we go to the editor/detail creationAnimatedCircularProgress
                // OR we could go to WorkoutIdSelection if we want them to pick specific workouts.     size={140}
                // For manual schedules without an event ID, we go to WorkoutEventDetail with a unique ID for that daywidth={30}
                navigation.navigate('WorkoutEventDetail', {RM / volumeGoal) * 100 : 0}
                  eventId: `manual_${todaysWorkoutDay}_${new Date().toISOString().split('T')[0]}`,
                  date: new Date().toISOString()
                });
              }
            } else {     />
              // Otherwise, open calendar to plan one      <View style={[styles.arrowCircle, { backgroundColor: '#F9104E' }]}>
              setCalendarInitialViewMode('day');          <Feather name="arrow-right" size={22} color="#000" />
              setCalendarInitialDate(new Date());          </View>
              setCalendarKey(prev => prev + 1);           </View>
              setFullCalendarVisible(true);                <View style={styles.activityStats}>
            }                  <Text style={styles.activityLabel}>1RM</Text>
          }}                  <Text style={[styles.activityCurrent, { color: '#F9104E' }]} numberOfLines={1} adjustsFontSizeToFit>
        />KG/{Math.round(volumeGoal)}DAY
      );t>
    }w>



    const metrics: { [key: string]: any } = {
      'ActivityRing': {
        isFull: true,'SetCount'), color: MetricColors.sets, val: totalSets, unit: 'SET', chart: setsChartData },
        render: () => (evel': {
          <View style={styles.activityCard}>,
            <TouchableOpacityavigate('RepsCount'),
              style={{ flex: 1 }}: MetricColors.weight,
              onPress={() => {
                if (!isEditing) navigation.navigate('DailySummaryDetail');
              }}
              activeOpacity={1}
              disabled={isEditing}
            >'1RM', action: () => navigation.navigate('OneRMTrend'), color: '#F9104E', val: Math.round(dailyMax1RM) || 0, unit: 'KG', chart: [] },
              <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Activity Ring</Text>gate('ProgressionTrend'), color: '#FF9F0A', val: '0', unit: '%', chart: [] },
              <View style={styles.activityContent}>on: () => navigation.navigate('RPETrend'), color: '#BF5AF2', val: '0', unit: '', chart: [] },
                <View style={styles.ringContainer}> => navigation.navigate('MoveScreen'), color: MetricColors.energy, val: dailyEnergy, unit: 'KCAL', chart: weightChartData },
                  <AnimatedCircularProgressurance', action: () => navigation.navigate('EnduranceTrend'), color: MetricColors.duration, val: dailyEndurance, unit: 'MIN', chart: [] },
                    size={140}, action: () => navigation.navigate('CadenceTrend'), color: MetricColors.speed, val: dailyCadence, unit: 's/r', chart: [] },
                    width={30} title: 'Intensity', action: () => navigation.navigate('IntensityTrend'), color: MetricColors.energy, val: dailyIntensity, unit: '', chart: [] },
                    fill={volumeGoal > 0 ? (dailyMax1RM / volumeGoal) * 100 : 0}), color: '#9DEC2C', val: dailyDensity, unit: '%', chart: [] },
                    tintColor="#F9104E"alanceTrend'), color: '#D1A3FF', val: dailyBalance, unit: '%', chart: [] },
                    backgroundColor="#3E0E18"
                    rotation={0}
                    lineCap="round"
                  />
                  <View style={[styles.arrowCircle, { backgroundColor: '#F9104E' }]}>
                    <Feather name="arrow-right" size={22} color="#000" />
                  </View>
                </View>ty={1}
                <View style={styles.activityStats}>{isEditing}
                  <Text style={styles.activityLabel}>1RM</Text>ionCard, TrendsSquareCardStyle.trendsGridContainer, { backgroundColor: SUMMARY_CARD_BG_COLOR }]}
                  <Text style={[styles.activityCurrent, { color: '#F9104E' }]} numberOfLines={1} adjustsFontSizeToFit>
                    {Math.round(dailyMax1RM)}KG/{Math.round(volumeGoal)}DAY   <Text style={TrendsSquareCardStyle.trendsGridTitle}>Trends</Text>
                  </Text>    <View style={TrendsSquareCardStyle.trendGrid}>
                </View>
              </View> 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => setEnergyModalVisible(true) },
            </TouchableOpacity>', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => setStrengthModalVisible(true) },
          </View>unit: 'SETS/DAY', color: MetricColors.sets, action: () => setSetsModalVisible(true) },
        )cy', val: trendStats.consistency, unit: '%', color: '#00C7BE', action: () => setConsistencyModalVisible(true) }
      },
      'SetCount': { title: 'Set Count', action: () => navigation.navigate('SetCount'), color: MetricColors.sets, val: totalSets, unit: 'SET', chart: setsChartData },chableOpacity
      'StrengthLevel': {
        title: 'Strength Level',=> {
        action: () => navigation.navigate('RepsCount'),            if (!isEditing) t.action();
        color: MetricColors.weight,
        val: Math.round(dailyMax1RM),
        unit: '1RM',
        ratio: dailyRatio.toFixed(2) + 'xBW',
        chart: weightChartData
      },
      'Stats_OneRM': { title: '1RM', action: () => navigation.navigate('OneRMTrend'), color: '#F9104E', val: Math.round(dailyMax1RM) || 0, unit: 'KG', chart: [] },
      'Stats_Progression': { title: 'Progression', action: () => navigation.navigate('ProgressionTrend'), color: '#FF9F0A', val: '0', unit: '%', chart: [] },
      'Stats_RPE': { title: 'RPE', action: () => navigation.navigate('RPETrend'), color: '#BF5AF2', val: '0', unit: '', chart: [] },
      'Energy': { title: 'Energy', action: () => navigation.navigate('MoveScreen'), color: MetricColors.energy, val: dailyEnergy, unit: 'KCAL', chart: weightChartData },     {t.val} {t.unit}
      'Endurance': { title: 'Endurance', action: () => navigation.navigate('EnduranceTrend'), color: MetricColors.duration, val: dailyEndurance, unit: 'MIN', chart: [] },/Text>
      'Cadence': { title: 'Cadence', action: () => navigation.navigate('CadenceTrend'), color: MetricColors.speed, val: dailyCadence, unit: 's/r', chart: [] },w>
      'Intensity': { title: 'Intensity', action: () => navigation.navigate('IntensityTrend'), color: MetricColors.energy, val: dailyIntensity, unit: '', chart: [] },Opacity>
      'Density': { title: 'Density', action: () => navigation.navigate('DensityTrend'), color: '#9DEC2C', val: dailyDensity, unit: '%', chart: [] },
      'Balance': { title: 'Balance', action: () => navigation.navigate('BalanceTrend'), color: '#D1A3FF', val: dailyBalance, unit: '%', chart: [] },
      'Trends': {uchableOpacity>
        isFull: true,
        render: () => (
          <TouchableOpacity
            onPress={() => {ull: true,
              if (!isEditing) navigation.navigate('Trends');
            }}
            activeOpacity={1}ess={() => {
            disabled={isEditing}
            style={[styles.sectionCard, TrendsSquareCardStyle.trendsGridContainer, { backgroundColor: SUMMARY_CARD_BG_COLOR }]}
          >
            <Text style={TrendsSquareCardStyle.trendsGridTitle}>Trends</Text>
            <View style={TrendsSquareCardStyle.trendGrid}>nCard, TrendsSquareCardStyle.trendsGridContainer, { backgroundColor: SUMMARY_CARD_BG_COLOR }]}
              {[
                { label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => setEnergyModalVisible(true) },endsSquareCardStyle.trendsGridTitle}>Trends</Text>
                { label: 'Volume', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => setStrengthModalVisible(true) },areCardStyle.trendGrid}>
                { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets, action: () => setSetsModalVisible(true) },
                { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE', action: () => setConsistencyModalVisible(true) }bel: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => setEnergyModalVisible(true) },
              ].map((t, idx) => (val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => setStrengthModalVisible(true) },
                <TouchableOpacitytrendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets, action: () => setSetsModalVisible(true) },
                  key={idx}onsistency, unit: '%', color: '#00C7BE', action: () => setConsistencyModalVisible(true) }
                  onPress={() => {ap((t, idx) => (
                    if (!isEditing) t.action();
                  }}dx}
                  activeOpacity={1}
                  disabled={isEditing}
                  style={TrendsSquareCardStyle.trendItem}
                >city={1}
                  <TrendGridIconAnimated color={t.color} />d={isEditing}
                  <View>reCardStyle.trendItem}
                    <Text style={TrendsSquareCardStyle.trendLabel}>{t.label}</Text>
                    <Text style={[TrendsSquareCardStyle.trendValue, { color: t.color }]}>TrendGridIconAnimated color={t.color} />
                      {t.val} {t.unit}
                    </Text>           <Text style={TrendsSquareCardStyle.trendLabel}>{t.label}</Text>
                  </View>            <Text style={[TrendsSquareCardStyle.trendValue, { color: t.color }]}>
                </TouchableOpacity>{t.val} {t.unit}
              ))}/Text>
            </View>w>
          </TouchableOpacity>Opacity>
        )
      },
      'Trends_Grid': {uchableOpacity>
        isFull: true,
        render: () => (
          <TouchableOpacity
            onPress={() => {ull: true,
              if (!isEditing) navigation.navigate('Trends');
            }}.sectionCard, { backgroundColor: '#1C1C1E', paddingHorizontal: 0, paddingBottom: 8, paddingTop: 8 }]}>
            activeOpacity={1}chableOpacity activeOpacity={0.7} onPress={() => { }}>
            disabled={isEditing}
            style={[styles.sectionCard, TrendsSquareCardStyle.trendsGridContainer, { backgroundColor: SUMMARY_CARD_BG_COLOR }]}
          >
            <Text style={TrendsSquareCardStyle.trendsGridTitle}>Trends</Text>
            <View style={TrendsSquareCardStyle.trendGrid}>
              {[
                { label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => setEnergyModalVisible(true) },,
                { label: 'Volume', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => setStrengthModalVisible(true) },6,
                { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets, action: () => setSetsModalVisible(true) },
                { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE', action: () => setConsistencyModalVisible(true) }
              ].map((t, idx) => (((workout: Workout, index: number) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => { style={{
                    if (!isEditing) t.action(); SCREEN_WIDTH - 32(container margin) - 32(inner padding) - 10(gap) / 2
                  }}erRadius: 16,
                  activeOpacity={1}
                  disabled={isEditing}
                  style={TrendsSquareCardStyle.trendItem}lumn',
                >ems: 'flex-start',
                  <TrendGridIconAnimated color={t.color} />roundColor: 'rgba(255, 255, 255, 0.12)',
                  <View>
                    <Text style={TrendsSquareCardStyle.trendLabel}>{t.label}</Text> }}
                    <Text style={[TrendsSquareCardStyle.trendValue, { color: t.color }]}>nPress={() => {
                      {t.val} {t.unit}iting) timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
                    </Text>         }}
                  </View>          activeOpacity={1}
                </TouchableOpacity>{isEditing}
              ))}
            </View>out.SvgIcon && <workout.SvgIcon width={34} height={34} fill="#9DEC2C" style={{ marginBottom: 2 }} />}
          </TouchableOpacity>
        )
      },
      'WorkoutShortcuts': {
        isFull: true,
        render: () => (
          <View key="workouts-main-section" style={[styles.sectionCard, { backgroundColor: '#1C1C1E', paddingHorizontal: 0, paddingBottom: 8, paddingTop: 8 }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => { }}>
              <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 4, marginBottom: 12, fontSize: 17 }]}>Workout</Text>
            </TouchableOpacity>
            <View style={{gth > 0
              flexDirection: 'row',llWorkouts.find(w => w.workoutId === recentSessions[0].workoutId)
              flexWrap: 'wrap',
              rowGap: 10,.SvgIcon;
              columnGap: 10,
              paddingHorizontal: 16,
              justifyContent: 'flex-start',
            }}>
              {workoutShortcuts.map((workout: Workout, index: number) => ({
                <TouchableOpacityerWithWorkoutSettings(latest.workoutId, latest.name);
                  key={index}
                  style={{
                    width: (SCREEN_WIDTH - 64 - 10) / 2, // SCREEN_WIDTH - 32(container margin) - 32(inner padding) - 10(gap) / 2
                    borderRadius: 16,
                    paddingHorizontal: 10,{[WorkoutSquareCardStyle.workoutSquareCard, { backgroundColor: '#1C1C1E' }]}
                    paddingVertical: 10,
                    flexDirection: 'column',
                    alignItems: 'flex-start',style={WorkoutSquareCardStyle.workoutSquareIconContainer}>
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',ifyContent: 'flex-start' }}>
                    borderWidth: 0,SquareCardStyle.workoutSquareIconWrapper}>
                  }}   {SvgIcon && <SvgIcon width={63} height={63} fill="#9DEC2C" />}
                  onPress={() => {
                    if (!isEditing) timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);{latest?.name || 'Workout'}</Text>
                  }}outSquareCardStyle.workoutSquareActionRow}>
                  activeOpacity={1}   <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />
                  disabled={isEditing} <Text style={WorkoutSquareCardStyle.workoutSquareActionText}>Start Workout</Text>
                > </View>
                  {workout.SvgIcon && <workout.SvgIcon width={34} height={34} fill="#9DEC2C" style={{ marginBottom: 2 }} />}       </View>
                  <Text style={styles.shortcutName} numberOfLines={1}>{workout.name}</Text>      </View>
                </TouchableOpacity>acity>
              ))}
            </View>
          </View>
        )
      },
      'Workout_Square': {
        isFull: false,    const m = metrics[compId];
        render: () => { return m.render();
          const latest = recentSessions.length > 0
            ? allWorkouts.find(w => w.workoutId === recentSessions[0].workoutId)nds_')) {
            : allWorkouts[0];nds_', '');
          const SvgIcon = latest?.SvgIcon; unit: string, screen: keyof RootStackParamList } } = {
 { title: 'Energy', color: MetricColors.energy, val: trendStats.energy, unit: 'KCAL/DAY', screen: 'MoveScreen' },
          return (h': { title: 'Strength', color: MetricColors.weight, val: trendStats.strength, unit: 'KG/DAY', screen: 'StrengthTrend' },
            <TouchableOpacity, color: MetricColors.sets, val: trendStats.sets, unit: 'SETS/DAY', screen: 'SetsTrend' },
              onPress={() => {onsistency', color: '#00C7BE', val: trendStats.consistency, unit: '%', screen: 'ConsistencyTrend' },
                if (!isEditing && latest) { 'REPS/DAY', screen: 'CadenceTrend' },
                  timerContext?.startTimerWithWorkoutSettings(latest.workoutId, latest.name);ity': { title: 'Density', color: '#9DEC2C', val: trendStats.density, unit: 'MIN/DAY', screen: 'DensityTrend' },
                }s.intensity, unit: 'MIN/DAY', screen: 'IntensityTrend' },
              }}trendStats.endurance, unit: 'MIN/DAY', screen: 'EnduranceTrend' },
              activeOpacity={1}rendStats.balance, unit: '%', screen: 'BalanceTrend' },
              disabled={isEditing}|| 0, unit: 'KG', screen: 'OneRMTrend' },
              style={[WorkoutSquareCardStyle.workoutSquareCard, { backgroundColor: '#1C1C1E' }]}t: '', screen: 'ProgressionTrend' },
            >RPE', color: '#BF5AF2', val: 'Check', unit: '', screen: 'RPETrend' },
              <Text style={WorkoutSquareCardStyle.workoutSquareHeader}>Workout</Text>
              <View style={WorkoutSquareCardStyle.workoutSquareIconContainer}>
                <View style={{ justifyContent: 'flex-start' }}>
                  <View style={WorkoutSquareCardStyle.workoutSquareIconWrapper}>
                    {SvgIcon && <SvgIcon width={63} height={63} fill="#9DEC2C" />}
                  </View>
                  <Text style={WorkoutSquareCardStyle.workoutSquareName} numberOfLines={1}>{latest?.name || 'Workout'}</Text>city
                  <View style={WorkoutSquareCardStyle.workoutSquareActionRow}>
                    <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />yle={TrendsSquareCardStyle.trendSquareCard}
                    <Text style={WorkoutSquareCardStyle.workoutSquareActionText}>Start Workout</Text> onPress={() => {
                  </View>    if (!isEditing) navigation.navigate(t.screen as any);
                </View>          }}
              </View>    activeOpacity={1}
            </TouchableOpacity>          disabled={isEditing}
          );
        }rd={t} />
      },        </TouchableOpacity>

    };

    const m = metrics[compId];
    if (m?.render) return m.render();

    if (compId.startsWith('Trends_')) {
      const trendType = compId.replace('Trends_', '');
      const trendData: { [key: string]: { title: string, color: string, val: number | string, unit: string, screen: keyof RootStackParamList } } = {
        'Energy': { title: 'Energy', color: MetricColors.energy, val: trendStats.energy, unit: 'KCAL/DAY', screen: 'MoveScreen' },
        'Strength': { title: 'Strength', color: MetricColors.weight, val: trendStats.strength, unit: 'KG/DAY', screen: 'StrengthTrend' },
        'Sets': { title: 'Sets', color: MetricColors.sets, val: trendStats.sets, unit: 'SETS/DAY', screen: 'SetsTrend' },
        'Consistency': { title: 'Consistency', color: '#00C7BE', val: trendStats.consistency, unit: '%', screen: 'ConsistencyTrend' },
        'Cadence': { title: 'Cadence', color: MetricColors.speed, val: trendStats.cadence, unit: 'REPS/DAY', screen: 'CadenceTrend' },
        'Density': { title: 'Density', color: '#9DEC2C', val: trendStats.density, unit: 'MIN/DAY', screen: 'DensityTrend' },
        'Intensity': { title: 'Intensity', color: MetricColors.energy, val: trendStats.intensity, unit: 'MIN/DAY', screen: 'IntensityTrend' },// ─────────────────────────────────────────────────────────────────────────────
        'Endurance': { title: 'Endurance', color: MetricColors.duration, val: trendStats.endurance, unit: 'MIN/DAY', screen: 'EnduranceTrend' },        // Stiller Modal carousel kartlarıyla aynı ölçülerde
        'Balance': { title: 'Balance', color: '#D1A3FF', val: trendStats.balance, unit: '%', screen: 'BalanceTrend' },
        'OneRM': { title: '1RM', color: '#F9104E', val: Math.round(dailyMax1RM) || 0, unit: 'KG', screen: 'OneRMTrend' },y
        'Progression': { title: 'Progression', color: '#FF9F0A', val: 'Check', unit: '', screen: 'ProgressionTrend' },            onPress={() => {
        'RPE': { title: 'RPE', color: '#BF5AF2', val: 'Check', unit: '', screen: 'RPETrend' },if (!isEditing) {
      };ext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);

      const t = trendData[trendType];
      if (!t) return null;{1}

      return (style={[{
        <TouchableOpacityWorkoutCardStyle.individualWorkoutCard,
          key={compId} '#1C1C1E',
          style={TrendsSquareCardStyle.trendSquareCard}     paddingTop: (IndividualWorkoutCardStyle.individualWorkoutCard?.paddingTop ?? 16) - 2,
          onPress={() => {tCardStyle.individualWorkoutCard?.paddingBottom ?? 16) - 2
            if (!isEditing) navigation.navigate(t.screen as any);
          }}  >
          activeOpacity={1}       <Text style={IndividualWorkoutCardStyle.individualWorkoutHeader}>Workout</Text>
          disabled={isEditing}            <View style={[IndividualWorkoutCardStyle.individualWorkoutIconContainer, { transform: [{ translateY: -2 }] }]}>
        > <View style={{ justifyContent: 'flex-start' }}>
          <TrendSquareCardAnimated card={t} />.individualWorkoutIconWrapper}>
        </TouchableOpacity>2C" />}
      );
    }Name} numberOfLines={1}>{workout.name}</Text>
idualWorkoutCardStyle.individualWorkoutActionRow}>
    if (!m) {                  <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />
      // Individual workout cards (Workout_{workoutId})lWorkoutCardStyle.individualWorkoutActionText}>Start Workout</Text>
      if (compId.startsWith('Workout_') && compId !== 'Workout_Square') {                </View>
        const workoutId = compId.replace('Workout_', '');              </View>
        const workout = allWorkouts.find(w => w.workoutId === workoutId);
        if (!workout) return null;ableOpacity>

        const SvgIcon = workout.SvgIcon;

_')) {
        // ─────────────────────────────────────────────────────────────────────────────Index = compId.lastIndexOf('_');
        // RENDERtring(0, lastUnderscoreIndex);
        // ─────────────────────────────────────────────────────────────────────────────
        // Stiller Modal carousel kartlarıyla aynı ölçülerde
        return (workout = allWorkouts.find(w => w.workoutId === wId);
          <TouchableOpacityStats[wId];
            onPress={() => {
              if (!isEditing) { return null;
                timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
              }version of the card
            }}
            activeOpacity={1}
            disabled={isEditing}uchableOpacity
            style={[{   key={compId}
              ...IndividualWorkoutCardStyle.individualWorkoutCard,dingBottom: 6, justifyContent: 'space-between', opacity: 0.6 }]}
              backgroundColor: '#1C1C1E',
              paddingTop: (IndividualWorkoutCardStyle.individualWorkoutCard?.paddingTop ?? 16) - 2,
              paddingBottom: (IndividualWorkoutCardStyle.individualWorkoutCard?.paddingBottom ?? 16) - 2
            }]}
          >koutName: workout.name,
            <Text style={IndividualWorkoutCardStyle.individualWorkoutHeader}>Workout</Text>
            <View style={[IndividualWorkoutCardStyle.individualWorkoutIconContainer, { transform: [{ translateY: -2 }] }]}>
              <View style={{ justifyContent: 'flex-start' }}>
                <View style={IndividualWorkoutCardStyle.individualWorkoutIconWrapper}>
                  {SvgIcon && <SvgIcon width={77} height={77} fill="#9DEC2C" />}city={1}
                </View>d={isEditing}
                <Text style={IndividualWorkoutCardStyle.individualWorkoutName} numberOfLines={1}>{workout.name}</Text>
                <View style={IndividualWorkoutCardStyle.individualWorkoutActionRow}>tyles.cardHeaderRow, { marginLeft: SquareCardMeasurements.workout.headerMarginLeft }]}>
                  <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />      {/* Removed gap: 6, added spacing to header content if needed */}
                  <Text style={IndividualWorkoutCardStyle.individualWorkoutActionText}>Start Workout</Text>         {workout.SvgIcon && <workout.SvgIcon width={25} height={25} fill="#FFF" />}
                </View>                <Text style={[styles.cardTitle, { fontSize: 13 }]} numberOfLines={1}>{workout.name}</Text>
              </View>
            </View>r', alignItems: 'center' }}>
          </TouchableOpacity>, fontSize: 11 }}>No Data Yet</Text>
        );Size: 10, marginTop: 2 }}>Start a session</Text>
      }              </View>

      if (compId.includes('_')) {gba(255,255,255,0.3)', fontSize: 10 }}>{metricId}</Text>
        const lastUnderscoreIndex = compId.lastIndexOf('_');              </View>
        const wId = compId.substring(0, lastUnderscoreIndex);
        const metricId = compId.substring(lastUnderscoreIndex + 1);          );

        const workout = allWorkouts.find(w => w.workoutId === wId);
        const stats = workoutStats[wId];= workout.name;

        if (!workout) return null;, unit = '', value = '', todayValue = '', chart: number[] = [];

        // If no stats, show a "No Data" version of the cardount') {
        if (!stats) {ts;
          return (
            <TouchableOpacity.toString() || '0';
              key={compId}|| '0';
              style={[styles.halfCard, styles.cardFront, { height: 171, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between', opacity: 0.6 }]} || [];
              onPress={() => { = 'Weekly Sets';
                if (!isEditing) {
                  navigation.navigate('WorkoutCategoryDetail', {(metricId === 'StrengthLevel') {
                    workoutId: wId,weight;
                    workoutName: workout.name,
                    focusMetric: metricId,ue = stats.weeklyStrength?.toString() || '0';
                  });
                }
              }}
              activeOpacity={1}
              disabled={isEditing}icId === 'Cadence') {
            >
              <View style={[styles.cardHeaderRow, { marginLeft: SquareCardMeasurements.workout.headerMarginLeft }]}>
                {/* Removed gap: 6, added spacing to header content if needed */}
                {workout.SvgIcon && <workout.SvgIcon width={25} height={25} fill="#FFF" />}= stats.cadence?.toString() || '0';
                <Text style={[styles.cardTitle, { fontSize: 13 }]} numberOfLines={1}>{workout.name}</Text>
              </View>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>No Data Yet</Text>Intensity') {
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>Start a session</Text>lor = MetricColors.energy;
              </View> unit = '';
              <View style={{ height: 30, paddingHorizontal: 12 }}>          value = stats.weeklyIntensity || '0:1';
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{metricId}</Text>nsity || '0:1';
              </View>s?.weeklyIntensity || [];
            </TouchableOpacity>
          );        }
        }') {

        let title = workout.name;
        let metricLabel = '';0';
        let color = '#FFF', unit = '', value = '', todayValue = '', chart: number[] = [];0';
[];
        if (metricId === 'SetCount') {y';
          color = MetricColors.sets;
          unit = 'SET';
          value = stats.weeklySets?.toString() || '0';
          todayValue = stats.sets?.toString() || '0';
          chart = stats.charts?.weeklySets || [];
          metricLabel = 'Weekly Sets';
        }
        else if (metricId === 'StrengthLevel') {
          color = MetricColors.weight;
          unit = 'T';') {
          value = stats.weeklyStrength?.toString() || '0';
          todayValue = stats.strength?.toString() || '0';
          chart = stats.charts?.weeklyStrength || [];'0';
          metricLabel = 'Weekly Strength';'0';
        } [];
        else if (metricId === 'Cadence') {cy';
          color = MetricColors.speed;
          unit = 's/r';
          value = stats.weeklyCadence?.toString() || '0';n;
          todayValue = stats.cadence?.toString() || '0';N';
          chart = stats.charts?.weeklyCadence || [];() || '0';
          metricLabel = 'Weekly Cadence';() || '0';
        }
        else if (metricId === 'Intensity') {
          color = MetricColors.energy;
          unit = '';
          value = stats.weeklyIntensity || '0:1';rs.energy;
          todayValue = stats.intensity || '0:1';L';
          chart = stats.charts?.weeklyIntensity || [];
          metricLabel = 'Weekly Intensity';
        }
        else if (metricId === 'Density') {
          color = '#9DEC2C';
          unit = '%';
          value = stats.weeklyDensity?.toString() || '0';Front stili ile aynı: height 171, paddingBottom 6
          todayValue = stats.density?.toString() || '0';
          chart = stats.charts?.weeklyDensity || [];
          metricLabel = 'Weekly Density';
        }t, { height: 171, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between' }]}
        else if (metricId === 'Balance') {
          color = '#D1A3FF';     if (!isEditing) {
          unit = '%';tegoryDetail', {
          value = stats.weeklyBalance?.toString() || '0'; wId,
          todayValue = stats.balance?.toString() || '0';koutName: workout.name,
          chart = stats.charts?.weeklyBalance || [];
          metricLabel = 'Weekly Balance';
        }
        else if (metricId === 'Consistency') {
          color = '#00C7BE';   activeOpacity={1}
          unit = '%';
          value = stats.weeklyConsistency?.toString() || '0';
          todayValue = stats.consistency?.toString() || '0'; Icon + Workout Name */}
          chart = stats.charts?.weeklyConsistency || [];t: SquareCardMeasurements.workout.headerMarginLeft }]}>
          metricLabel = 'Weekly Consistency';
        }th={25} height={25} fill="#FFF" />}
        else if (metricId === 'Endurance') {ardTitle]} numberOfLines={1}>{title}</Text>
          color = MetricColors.duration;   </View>
          unit = 'MIN';
          value = stats.weeklyEndurance?.toString() || '0';tSubLabel}>{metricLabel}</Text>
          todayValue = stats.endurance?.toString() || '0';alue */}
          chart = stats.charts?.weeklyEndurance || [];ems: 'baseline', marginTop: -6 }}>
          metricLabel = 'Weekly Endurance';{ color }]}>{value}</Text>
        }olor }]}>{unit}</Text>
        else if (metricId === 'Energy') {
          color = MetricColors.energy;   {/* Weekly Chart with Day Labels */}
          unit = 'KCAL';            <View style={styles.workoutChartContainer}>
          value = stats.weeklyEnergy?.toString() || '0';
          todayValue = stats.energy?.toString() || '0';const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
          chart = stats.charts?.weeklyEnergy || [];l = Math.max(...chart.slice(0, 7), 1);
          metricLabel = 'Weekly Energy';rHeight = (val / maxVal) * 30;
        }
gment key={i}>
        // Modal workoutCardFront stili ile aynı: height 171, paddingBottom 6 (
        return (ackgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
          <TouchableOpacity
            key={compId}s: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
            style={[styles.halfCard, styles.cardFront, { height: 171, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between' }]}es.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: color, borderRadius: 3 }]} />
            onPress={() => {   <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>
              if (!isEditing) {     </View>
                navigation.navigate('WorkoutCategoryDetail', {      <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                  workoutId: wId,gment>
                  workoutName: workout.name,
                  focusMetric: metricId,   })}
                });
              }
            }}outTodayFooter}>
            activeOpacity={1}
            disabled={isEditing}
          >
            {/* Header: Icon + Workout Name */}
            <View style={[styles.cardHeaderRow, { marginLeft: SquareCardMeasurements.workout.headerMarginLeft }]}>
              {/* Removed gap: 6 */}
              {workout.SvgIcon && <workout.SvgIcon width={25} height={25} fill="#FFF" />}
              <Text style={[styles.workoutCardTitle]} numberOfLines={1}>{title}</Text>
            </View>
            {/* Metric Label */}
            <Text style={styles.workoutSubLabel}>{metricLabel}</Text>thLevel', 'Energy', 'Endurance', 'Cadence', 'Intensity', 'Density', 'Balance', 'Stats_OneRM', 'Stats_Progression', 'Stats_RPE'];
            {/* Metric Value */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -6 }}>
              <Text style={[styles.workoutMetricValue, { color }]}>{value}</Text>
              <Text style={[styles.workoutUnit, { color }]}>{unit}</Text> 'Stats_OneRM' || compId === 'Stats_Progression';
            </View>
            {/* Weekly Chart with Day Labels */}
            <View style={styles.workoutChartContainer}>
              {chart.slice(0, 7).map((val: number, i: number) => {, { height: 170, paddingTop: 10, paddingBottom: 6, backgroundColor: '#1C1C1E', overflow: 'hidden' }]}
                const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                const maxVal = Math.max(...chart.slice(0, 7), 1);ting) m.action();
                const barHeight = (val / maxVal) * 30;
                return (
                  <React.Fragment key={i}>
                    {i === 0 && (
                      <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                    )}rdTitle, { fontSize: 17, textTransform: 'none', marginBottom: 0, flex: 1 }]}>{m.title}</Text>
                    <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
                      <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: color, borderRadius: 3 }]} />tyle={{ marginTop: 4, flex: 1, overflow: 'hidden' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>tyle={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 2, textTransform: 'none' }]}>Today</Text>
                    </View>irection: 'row', alignItems: 'baseline', marginTop: -2 }}>
                    <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />lor: m.color, fontSize: 28, fontWeight: '700' }]}>
                  </React.Fragment>
                );Weight: '700' }]}>{m.unit}</Text>
              })}t>
            </View>
            {/* Today Footer */}      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6, fontWeight: '500' }}>
            <Text style={styles.workoutTodayFooter}>           {m.ratio}
              <Text style={{ color: '#FFF' }}>Today: </Text>                </Text>
              <Text style={{ color }}>{todayValue}{unit}</Text>
            </Text>       </View>
          </TouchableOpacity>            <View style={[styles.barChartContainer, { height: 55, marginBottom: 0, marginTop: 2, overflow: 'hidden' }]}>
        );
      }artData : new Array(24).fill(0)).map((val: number, i: number) => {
Val = isStrength ? val / 1000 : val;
      return null;xVal = Math.max(...(chartData.length > 0 ? chartData : [1]).map((v: number) => isStrength ? v / 1000 : v), 1);
    }

    const globalMetricIds = ['SetCount', 'StrengthLevel', 'Energy', 'Endurance', 'Cadence', 'Intensity', 'Density', 'Balance', 'Stats_OneRM', 'Stats_Progression', 'Stats_RPE'];      <View key={i} style={{ width: 3, height: 55, justifyContent: 'flex-end' }}>
    if (globalMetricIds.includes(compId)) {ew style={[styles.bar, { height: '100%', backgroundColor: 'rgba(90, 90, 92, 0.4)', position: 'absolute', bottom: 0 }]} />
      const m = metrics[compId];
      if (!m) return null;>
      const isStrength = compId === 'StrengthLevel' || compId === 'Stats_OneRM' || compId === 'Stats_Progression';
      const chartData = m.chart || [];    })}
      return (
        <TouchableOpacityyles.chartLabelsOverlay, { justifyContent: 'space-between', paddingHorizontal: 0 }]}>
          style={[styles.halfCard, { height: 170, paddingTop: 10, paddingBottom: 6, backgroundColor: '#1C1C1E', overflow: 'hidden' }]}       <Text style={[styles.chartLabelText, { backgroundColor: 'transparent' }]}>00</Text>
          onPress={() => {or: 'transparent' }]}>06</Text>
            if (!isEditing) m.action();
          }}Text style={[styles.chartLabelText, { backgroundColor: 'transparent' }]}>18</Text>
          activeOpacity={1}
          disabled={isEditing}
        >
          <View style={[styles.cardHeaderRow, { paddingRight: 8 }]}>
            <Text style={[styles.cardTitle, { fontSize: 17, textTransform: 'none', marginBottom: 0, flex: 1 }]}>{m.title}</Text>
          </View>
          <View style={{ marginTop: 4, flex: 1, overflow: 'hidden' }}>de...
            <Text style={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 2, textTransform: 'none' }]}>Today</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -2 }}>
              <Text style={[styles.metricValue, { color: m.color, fontSize: 28, fontWeight: '700' }]}>
                {m.val}{' '}MenuProvider>
                <Text style={[styles.unit, { fontSize: 18, fontWeight: '700' }]}>{m.unit}</Text>e={styles.container}>
              </Text>barStyle="light-content" />
              {m.ratio && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6, fontWeight: '500' }}>
                  {m.ratio}0 }]}>
                </Text>gStyle]}>
              )}
            </View>ent']}
            <View style={[styles.barChartContainer, { height: 55, marginBottom: 0, marginTop: 2, overflow: 'hidden' }]}>s.headerBlur}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', height: '100%' }}>
                {(chartData.length > 0 ? chartData : new Array(24).fill(0)).map((val: number, i: number) => {
                  const computedVal = isStrength ? val / 1000 : val;
                  const maxVal = Math.max(...(chartData.length > 0 ? chartData : [1]).map((v: number) => isStrength ? v / 1000 : v), 1);
                  const barHeight = (computedVal / maxVal) * (55 * 0.8);
                  return (le={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                    <View key={i} style={{ width: 3, height: 55, justifyContent: 'flex-end' }}>eOpacity
                      <View style={[styles.bar, { height: '100%', backgroundColor: 'rgba(90, 90, 92, 0.4)', position: 'absolute', bottom: 0 }]} />
                      {val > 0 && <View style={[styles.bar, { height: Math.max(barHeight, 4), backgroundColor: m.color }]} />}
                    </View>
                  );
                })}
              </View>hableOpacity
              <View style={[styles.chartLabelsOverlay, { justifyContent: 'space-between', paddingHorizontal: 0 }]}>tyle={[styles.headerIconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                <Text style={[styles.chartLabelText, { backgroundColor: 'transparent' }]}>00</Text> onPress={() => setAddCardModalVisible(true)}
                <Text style={[styles.chartLabelText, { backgroundColor: 'transparent' }]}>06</Text>city={0.7}
                <Text style={[styles.chartLabelText, { backgroundColor: 'transparent' }]}>12</Text>        >
                <Text style={[styles.chartLabelText, { backgroundColor: 'transparent' }]}>18</Text>             <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
              </View>eOpacity>
            </View>          ) : (
          </View>                <View style={{ width: 48 }} />
        </TouchableOpacity>    )}
      );
    }
    // ...existing code...
  };              <Animated.View style={[styles.headerCenterTitle, stickyTitleStyle, { alignItems: 'center' }]} pointerEvents="none">
tickyTitleText, { fontSize: 16, fontWeight: 'bold' }]}>Summary</Text>
  return (>{formatDate()}</Text>
    <UnifiedLiquidGlassMenuProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Dynamic Blurred Header */}
               <Animated.View style={[styles.header, isEditing && { paddingTop: 50, paddingBottom: 8, marginBottom: 0 }]}>utton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
          <Animated.View style={[styles.headerBlurContainer, headerBgStyle]}>  onPress={handleDoneEditing}
            <LinearGradientity={0.7}
              colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.85)', 'transparent']}              >
              style={styles.headerBlur}
              start={{ x: 0.5, y: 0 }}ity>
              end={{ x: 0.5, y: 1 }}
            />eaderRightContainer}>
          </Animated.View>ty
     style={[styles.headerIconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>) => setFullCalendarVisible(true)}
            <TouchableOpacity0.7}
              onPress={isEditing ? () => setAddCardModalVisible(true) : undefined}
              disabled={!isEditing}" size={22} color="#FFF" />
              activeOpacity={1}
            >TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
              {isEditing ? (="#555" />
                <TouchableOpacity
                  style={[styles.headerIconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}w>
                  onPress={() => setAddCardModalVisible(true)}
                  activeOpacity={0.7}>
                >
                  <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 48 }} />
              )}
            </TouchableOpacity>
llEventThrottle={16}
            {!isEditing && (          onScroll={scrollHandler}
              <Animated.View style={[styles.headerCenterTitle, stickyTitleStyle, { alignItems: 'center' }]} pointerEvents="none">led={true}
                <Text style={[styles.stickyTitleText, { fontSize: 16, fontWeight: 'bold' }]}>Summary</Text>
                <Text style={[styles.headerDate, { marginTop: 3, fontSize: 13, color: '#8E8E93', textTransform: 'none' }]}>{formatDate()}</Text>
              </Animated.View>
            )}geTitleContainer}>
Text style={styles.headerTitle}>Summary</Text>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={handleDoneEditing}
                activeOpacity={0.7}in in Edit Mode */}
              >
                <MaterialCommunityIcons name="check" size={22} color="#FFF" />
              </TouchableOpacity>/}
            ) : (le.Flex
              <View style={styles.headerRightContainer}>
                <TouchableOpacity
                  style={[styles.headerIconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                  onPress={() => setFullCalendarVisible(true)}
                  activeOpacity={0.7}art"
                >0}
                  <MaterialCommunityIcons name="calendar-month" size={22} color="#FFF" />lumnGap={10}
                </TouchableOpacity>eItemScale={1}
                <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>acity={1}
                  <MaterialCommunityIcons name="account-circle" size={40} color="#555" />            activeItemShadowOpacity={0}
                </TouchableOpacity>ity={1}
              </View>cale={1}
            )}
          </View>edVisibleCardIds);
        </Animated.View>s(nextOrder);
(SUMMARY_CARD_STORAGE_KEY, JSON.stringify(nextOrder));
        <Animated.ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}   {normalizedVisibleCardIds
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}nything in metricPreviews (matching original or normalized ID)
          scrollEventThrottle={16} id || normalizeCardId(m.id) === id)) return true;
          onScroll={scrollHandler}
          nestedScrollEnabled={true}|| id === 'Sessions_Square' || id === 'Workout_Square' || id === 'WorkoutShortcuts' || id === 'Trends' || id === 'ActivityRing' || id === 'DailyWorkout' || id === 'StrengthLevel' || id === 'SetCount' || id === 'Energy' || id === 'Endurance' || id === 'Cadence' || id === 'Intensity' || id === 'Density' || id === 'Balance' || id.startsWith('Sessions_') || id.startsWith('Workout_') || id.startsWith('Trends_') || id.startsWith('Stats_')) return true;
        >Allow dynamic IDs (containing underscores)
          {/* Large Title Section */}    return id.includes('_');
          {!isEditing && (              })
            <View style={styles.largeTitleContainer}>
              <Text style={styles.headerTitle}>Summary</Text>
              <Text style={styles.headerDate}>{formatDate()}</Text>                  key={id}
            </View>
          )}h: isFullWidthCard(id) ? SCREEN_WIDTH - 32 : (SCREEN_WIDTH - 44) / 2,
tive',
          {/* Header to Card Margin in Edit Mode */}ible',
          {isEditing && <View style={{ height: 80 }} />}

          {/* Dynamic Summary Cards */}
          <Sortable.FlexerSummaryCard(id)}
            sortEnabled={isEditing}eleteIcon(id)}
            hapticsEnabled={false}
            flexDirection="row"
            flexWrap="wrap"
            justifyContent="flex-start"
            rowGap={10}
            columnGap={10}
            activeItemScale={1}
            activeItemOpacity={1}/>
            activeItemShadowOpacity={0}
            inactiveItemOpacity={1}<View style={{ height: 20 }} />
            inactiveItemScale={1}
            onDragEnd={({ order }) => {
              const nextOrder = order(normalizedVisibleCardIds);s.bottomLargeButton, { marginBottom: 10 }]}
              setVisibleCardIds(nextOrder);
              AsyncStorage.setItem(SUMMARY_CARD_STORAGE_KEY, JSON.stringify(nextOrder));
            }}
          >
            {normalizedVisibleCardIds
              .filter(id => {
                // Allow anything in metricPreviews (matching original or normalized ID)ouchableOpacity
                if (metricPreviews.some(m => m.id === id || normalizeCardId(m.id) === id)) return true;les.bottomLargeButton}
                // Allow other specific IDsss={() => navigation.navigate('AllCategories')}
                if (id === 'Sessions_List' || id === 'Trends_Grid' || id === 'Sessions_Square' || id === 'Workout_Square' || id === 'WorkoutShortcuts' || id === 'Trends' || id === 'ActivityRing' || id === 'DailyWorkout' || id === 'StrengthLevel' || id === 'SetCount' || id === 'Energy' || id === 'Endurance' || id === 'Cadence' || id === 'Intensity' || id === 'Density' || id === 'Balance' || id.startsWith('Sessions_') || id.startsWith('Workout_') || id.startsWith('Trends_') || id.startsWith('Stats_')) return true;ity={1}
                // Allow dynamic IDs (containing underscores)
                return id.includes('_');
              })
              .map(id => (
                <View
                  key={id}
                  style={{cer to maintain page height in edit mode */}
                    width: isFullWidthCard(id) ? SCREEN_WIDTH - 32 : (SCREEN_WIDTH - 44) / 2,
                    position: 'relative',} />
                    overflow: 'visible',
                    zIndex: 1,d.ScrollView>
                  }}
                >        {/* Fullscreen Calendar Overlay */}
                  {renderSummaryCard(id)}(
                  {renderDeleteIcon(id)}yleSheet.absoluteFill, { backgroundColor: '#000', zIndex: 1000 }]}>
                </View>iew style={{ height: 40 }} />
              ))}
          </Sortable.Flex>

          {/* Bottom Buttons */}              events={calendarEvents}
          {!isEditing && (calendarInitialViewMode}
            <>
              <View style={{ height: 20 }} />
              <View style={styles.separator} />alendarDayPress}
              <View style={{ height: 20 }} />nEventPress={handleEventPress}

              <TouchableOpacitydleCalendarEventsChange}
                style={[styles.bottomLargeButton, { marginBottom: 10 }]}              onFullScreenPress={() => {
                onPress={() => setIsEditing(true)}Visible(false);
                activeOpacity={1}normal open
              >
                <Text style={styles.bottomLargeButtonText}>Edit Summary</Text>lDate(undefined);
              </TouchableOpacity>}

              <TouchableOpacity
                style={styles.bottomLargeButton}
                onPress={() => navigation.navigate('AllCategories')}
                activeOpacity={1}        <Modal
              >
                <Text style={styles.bottomLargeButtonText}>See All Categories</Text>slide"
              </TouchableOpacity>
            </>RequestClose={() => setConsistencyModalVisible(false)}
          )}
          <View style={styles.modalContainer}>
          {/* Spacer to maintain page height in edit mode */}t}>
          {isEditing && (.modalHeader}>
            <View style={{ height: 260 }} />
          )}() => setConsistencyModalVisible(false)} activeOpacity={1}>
        </Animated.ScrollView>size={24} color="#FFF" />
ity>
        {/* Fullscreen Calendar Overlay */}
        {fullCalendarVisible && (alBody}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', zIndex: 1000 }]}> { backgroundColor: '#00C7BE20' }]}>
            <View style={{ height: 40 }} />, { color: '#00C7BE' }]}>{trendStats.consistency}%</Text>
            <CollapsibleCalendarCard
              key={calendarKey}orkout Frequency</Text>
              schedule={calendarSchedule}ription}>
              events={calendarEvents}how regularly you've been working out over the past 7 days.
              initialViewMode={calendarInitialViewMode}
              initialSelectedDate={calendarInitialDate}dicates better workout consistency and discipline.
              navigation={navigation}
              onDayPress={handleCalendarDayPress}
              onEventPress={handleEventPress}>
              onCreateEvent={handleCreateEvent}abel}>Days Active</Text>
              onEventsChange={handleCalendarEventsChange}    <Text style={[styles.modalStatValue, { color: '#00C7BE' }]}>{Math.round((trendStats.consistency / 100) * 7)}/7</Text>
              onFullScreenPress={() => {    </View>
                setFullCalendarVisible(false);/View>
                // Reset to month view for next normal open    </View>
                setCalendarInitialViewMode('month');            </View>
                setCalendarInitialDate(undefined);ew>
              }}
            />
          </View>
        )}
 animationType="slide"
        <Modal
          visible={consistencyModalVisible}lVisible(false)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setConsistencyModalVisible(false)}
        >
          <View style={styles.modalContainer}>.modalTitle}>Balance</Text>
            <View style={styles.modalContent}>hableOpacity onPress={() => setBalanceModalVisible(false)} activeOpacity={1}>
              <View style={styles.modalHeader}> color="#FFF" />
                <Text style={styles.modalTitle}>Consistency</Text>
                <TouchableOpacity onPress={() => setConsistencyModalVisible(false)} activeOpacity={1}>
                  <Feather name="x" size={24} color="#FFF" />le={styles.modalBody}>
                </TouchableOpacity>r: '#D1A3FF20' }]}>
              </View>e, { color: '#D1A3FF' }]}>{trendStats.balance}%</Text>
              <View style={styles.modalBody}>
                <View style={[styles.modalMetricCircle, { backgroundColor: '#00C7BE20' }]}>e={styles.modalLabel}>Training Variety</Text>
                  <Text style={[styles.modalMetricValue, { color: '#00C7BE' }]}>{trendStats.consistency}%</Text>
                </View>balance score reflects the variety in your training routine across different fitness metrics.
                <Text style={styles.modalLabel}>Workout Frequency</Text>
                <Text style={styles.modalDescription}>gets multiple fitness dimensions for optimal health.
                  Your consistency score shows how regularly you've been working out over the past 7 days.
                  {'\n\n'}
                  A higher percentage indicates better workout consistency and discipline.tyle={styles.modalStatItem}>
                </Text>xt style={styles.modalStatLabel}>Metrics Used</Text>
                <View style={styles.modalStats}>Text style={[styles.modalStatValue, { color: '#D1A3FF' }]}>{Math.round((trendStats.balance / 100) * 4)}/4</Text>
                  <View style={styles.modalStatItem}>/View>
                    <Text style={styles.modalStatLabel}>Days Active</Text>/View>
                    <Text style={[styles.modalStatValue, { color: '#00C7BE' }]}>{Math.round((trendStats.consistency / 100) * 7)}/7</Text>View>
                  </View>            </View>
                </View>ew>
              </View>
            </View>
          </View>
        </Modal>
 animationType="slide"
        <Modal
          visible={balanceModalVisible}Visible(false)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBalanceModalVisible(false)}
        >
          <View style={styles.modalContainer}>.modalTitle}>Energy</Text>
            <View style={styles.modalContent}>hableOpacity onPress={() => setEnergyModalVisible(false)} activeOpacity={1}>
              <View style={styles.modalHeader}> color="#FFF" />
                <Text style={styles.modalTitle}>Balance</Text>
                <TouchableOpacity onPress={() => setBalanceModalVisible(false)} activeOpacity={1}>
                  <Feather name="x" size={24} color="#FFF" />le={styles.modalBody}>
                </TouchableOpacity>or: `${MetricColors.energy}20` }]}>
              </View>e, { color: MetricColors.energy }]}>{trendStats.energy}</Text>
              <View style={styles.modalBody}>
                <View style={[styles.modalMetricCircle, { backgroundColor: '#D1A3FF20' }]}>
                  <Text style={[styles.modalMetricValue, { color: '#D1A3FF' }]}>{trendStats.balance}%</Text>
                </View>tyle={styles.modalDescription}>
                <Text style={styles.modalLabel}>Training Variety</Text>n from workouts over the past 7 days.
                <Text style={styles.modalDescription}>
                  Your balance score reflects the variety in your training routine across different fitness metrics.balance between activity and nutrition.
                  {'\n\n'}
                  A well-balanced workout routine targets multiple fitness dimensions for optimal health.
                </Text>
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Metrics Used</Text>
                    <Text style={[styles.modalStatValue, { color: '#D1A3FF' }]}>{Math.round((trendStats.balance / 100) * 4)}/4</Text>
                  </View>          visible={strengthModalVisible}
                </View>ationType="slide"
              </View>
            </View> setStrengthModalVisible(false)}
          </View>
        </Modal>
   <View style={styles.modalContent}>
        <Modal>
          visible={energyModalVisible}}>Strength</Text>
          animationType="slide"> setStrengthModalVisible(false)} activeOpacity={1}>
          transparent={true}
          onRequestClose={() => setEnergyModalVisible(false)}
        >
          <View style={styles.modalContainer}>odalBody}>
            <View style={styles.modalContent}> style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.weight}20` }]}>
              <View style={styles.modalHeader}>etricValue, { color: MetricColors.weight }]}>{trendStats.strength}</Text>
                <Text style={styles.modalTitle}>Energy</Text>Y</Text>
                <TouchableOpacity onPress={() => setEnergyModalVisible(false)} activeOpacity={1}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>tyle={styles.modalDescription}>
              </View>r the past 7 days.
              <View style={styles.modalBody}>
                <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.energy}20` }]}>gressive overload.
                  <Text style={[styles.modalMetricValue, { color: MetricColors.energy }]}>{trendStats.energy}</Text>
                  <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>KCAL/DAY</Text>
                </View>
                <Text style={styles.modalLabel}>Daily Energy Expenditure</Text>
                <Text style={styles.modalDescription}>
                  Your average daily calorie burn from workouts over the past 7 days.
                  {'\n\n'}
                  Tracking energy expenditure helps you maintain a healthy balance between activity and nutrition.          visible={setsModalVisible}
                </Text>ationType="slide"
              </View>
            </View> setSetsModalVisible(false)}
          </View>
        </Modal>
   <View style={styles.modalContent}>
        <Modal>
          visible={strengthModalVisible}}>Sets</Text>
          animationType="slide"> setSetsModalVisible(false)} activeOpacity={1}>
          transparent={true}
          onRequestClose={() => setStrengthModalVisible(false)}
        >
          <View style={styles.modalContainer}>odalBody}>
            <View style={styles.modalContent}> style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.sets}20` }]}>
              <View style={styles.modalHeader}>etricValue, { color: MetricColors.sets }]}>{trendStats.sets}</Text>
                <Text style={styles.modalTitle}>Strength</Text>DAY</Text>
                <TouchableOpacity onPress={() => setStrengthModalVisible(false)} activeOpacity={1}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>tyle={styles.modalDescription}>
              </View>he past 7 days.
              <View style={styles.modalBody}>
                <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.weight}20` }]}>e.
                  <Text style={[styles.modalMetricValue, { color: MetricColors.weight }]}>{trendStats.strength}</Text>
                  <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>KG/DAY</Text>
                </View>
                <Text style={styles.modalLabel}>Training Volume</Text>
                <Text style={styles.modalDescription}>
                  Your average daily training volume (weight × sets × reps) over the past 7 days.
                  {'\n\n'}
                  Higher volume indicates greater strength training intensity and progressive overload.          visible={enduranceModalVisible}
                </Text>ationType="slide"
              </View>
            </View> setEnduranceModalVisible(false)}
          </View>
        </Modal>
   <View style={styles.modalContent}>
        <Modal>
          visible={setsModalVisible}}>Endurance</Text>
          animationType="slide"> setEnduranceModalVisible(false)} activeOpacity={1}>
          transparent={true}/>
          onRequestClose={() => setSetsModalVisible(false)}
        >
          <View style={styles.modalContainer}>odalBody}>
            <View style={styles.modalContent}> style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.duration}20` }]}>
              <View style={styles.modalHeader}>etricValue, { color: MetricColors.duration }]}>{trendStats.endurance}</Text>
                <Text style={styles.modalTitle}>Sets</Text>/DAY</Text>
                <TouchableOpacity onPress={() => setSetsModalVisible(false)} activeOpacity={1}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>tyle={styles.modalDescription}>
              </View>.
              <View style={styles.modalBody}>
                <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.sets}20` }]}>over time.
                  <Text style={[styles.modalMetricValue, { color: MetricColors.sets }]}>{trendStats.sets}</Text>
                  <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>SETS/DAY</Text>
                </View>
                <Text style={styles.modalLabel}>Daily Training Sets</Text>
                <Text style={styles.modalDescription}>
                  Your average number of sets completed per day over the past 7 days.
                  {'\n\n'}out Metrics Modal - 9 Metric Grid */}
                  Consistent set completion demonstrates workout discipline and training adherence.        <Modal
                </Text>ble={workoutMetricsModalVisible}
              </View>
            </View>
          </View> => setWorkoutMetricsModalVisible(false)}
        </Modal>
 <View style={styles.modalContainer}>
        <Modal { maxHeight: '90%' }]}>
          visible={enduranceModalVisible}>
          animationType="slide">
          transparent={true}
          onRequestClose={() => setEnduranceModalVisible(false)}kout'
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>hableOpacity onPress={() => setWorkoutMetricsModalVisible(false)} activeOpacity={1}>
              <View style={styles.modalHeader}> color="#FFF" />
                <Text style={styles.modalTitle}>Endurance</Text>
                <TouchableOpacity onPress={() => setEnduranceModalVisible(false)} activeOpacity={1}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>edWorkoutForMetrics && workoutStats[selectedWorkoutForMetrics] && (() => {
              </View>;
              <View style={styles.modalBody}>> w.workoutId === selectedWorkoutForMetrics);
                <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.duration}20` }]}>
                  <Text style={[styles.modalMetricValue, { color: MetricColors.duration }]}>{trendStats.endurance}</Text>l: 'Sets', value: stats.weeklySets || 0, todayValue: stats.sets || 0, unit: 'SET', color: MetricColors.sets, chart: stats.charts?.weeklySets || [] },
                  <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>MIN/DAY</Text>rength || 0, unit: 'KG', color: MetricColors.weight, chart: stats.charts?.weeklyStrength || [] },
                </View>abel: 'Energy', value: stats.weeklyEnergy || 0, todayValue: stats.energy || 0, unit: 'KCAL', color: MetricColors.energy, chart: stats.charts?.weeklyEnergy || [] },
                <Text style={styles.modalLabel}>Workout Duration</Text> label: 'Cadence', value: stats.weeklyCadence || 0, todayValue: stats.cadence || 0, unit: 's/r', color: MetricColors.speed, chart: stats.charts?.weeklyCadence || [] },
                <Text style={styles.modalDescription}> { label: 'Intensity', value: stats.weeklyIntensity || '0:1', todayValue: stats.intensity || '0:1', unit: '', color: MetricColors.energy, chart: stats.charts?.weeklyIntensity || [] },
                  Your average daily workout duration over the past 7 days.   { label: 'Density', value: stats.weeklyDensity || 0, todayValue: stats.density || 0, unit: '%', color: '#9DEC2C', chart: stats.charts?.weeklyDensity || [] },
                  {'\n\n'}    { label: 'Consistency', value: stats.weeklyConsistency || 0, todayValue: stats.consistency || 0, unit: '%', color: '#00C7BE', chart: stats.charts?.weeklyConsistency || [] },
                  Longer workout sessions build cardiovascular endurance and stamina over time.                    { label: 'Endurance', value: stats.weeklyEndurance || 0, todayValue: stats.endurance || 0, unit: 'MIN', color: MetricColors.duration, chart: stats.charts?.weeklyEndurance || [] },
                </Text>weeklyBalance || 0, todayValue: stats.balance || 0, unit: '%', color: '#D1A3FF', chart: stats.charts?.weeklyBalance || [] },
              </View>    ];
            </View>'W', 'T', 'F', 'S', 'S'];
          </View>
        </Modal>

        {/* Workout Metrics Modal - 9 Metric Grid */}             {metricsData.map((metric, idx) => {
        <Modalx(...metric.chart.slice(0, 7), 1);
          visible={workoutMetricsModalVisible}
          animationType="slide"={[styles.workoutMetricCard, { marginBottom: 12 }]}>
          transparent={true}workoutMetricLabel}>{metric.label}</Text>
          onRequestClose={() => setWorkoutMetricsModalVisible(false)}lexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
        >4 }]}>{metric.value}</Text>
          <View style={styles.modalContainer}>e={[styles.workoutUnit, { color: metric.color, fontSize: 14, marginLeft: 4 }]}>{metric.unit}</Text>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>     </View>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>val: number, i: number) => {
                  {selectedWorkoutForMetricsst barHeight = (val / maxVal) * 30;
                    ? allWorkouts.find(w => w.workoutId === selectedWorkoutForMetrics)?.name || 'Workout'           return (
                    : 'Workout'} Metrics
                </Text>
                <TouchableOpacity onPress={() => setWorkoutMetricsModalVisible(false)} activeOpacity={1}> 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>ew style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
              </View>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {selectedWorkoutForMetrics && workoutStats[selectedWorkoutForMetrics] && (() => {
                  const stats = workoutStats[selectedWorkoutForMetrics];
                  const workout = allWorkouts.find(w => w.workoutId === selectedWorkoutForMetrics);
                  const metricsData = [
                    { label: 'Sets', value: stats.weeklySets || 0, todayValue: stats.sets || 0, unit: 'SET', color: MetricColors.sets, chart: stats.charts?.weeklySets || [] },
                    { label: 'Strength', value: stats.weeklyStrength || 0, todayValue: stats.strength || 0, unit: 'KG', color: MetricColors.weight, chart: stats.charts?.weeklyStrength || [] },
                    { label: 'Energy', value: stats.weeklyEnergy || 0, todayValue: stats.energy || 0, unit: 'KCAL', color: MetricColors.energy, chart: stats.charts?.weeklyEnergy || [] },
                    { label: 'Cadence', value: stats.weeklyCadence || 0, todayValue: stats.cadence || 0, unit: 's/r', color: MetricColors.speed, chart: stats.charts?.weeklyCadence || [] },          <Text style={{ color: '#8E8E93' }}>Today: </Text>
                    { label: 'Intensity', value: stats.weeklyIntensity || '0:1', todayValue: stats.intensity || '0:1', unit: '', color: MetricColors.energy, chart: stats.charts?.weeklyIntensity || [] },tric.todayValue} {metric.unit}</Text>
                    { label: 'Density', value: stats.weeklyDensity || 0, todayValue: stats.density || 0, unit: '%', color: '#9DEC2C', chart: stats.charts?.weeklyDensity || [] },                            </Text>
                    { label: 'Consistency', value: stats.weeklyConsistency || 0, todayValue: stats.consistency || 0, unit: '%', color: '#00C7BE', chart: stats.charts?.weeklyConsistency || [] },</View>
                    { label: 'Endurance', value: stats.weeklyEndurance || 0, todayValue: stats.endurance || 0, unit: 'MIN', color: MetricColors.duration, chart: stats.charts?.weeklyEndurance || [] },
                    { label: 'Balance', value: stats.weeklyBalance || 0, todayValue: stats.balance || 0, unit: '%', color: '#D1A3FF', chart: stats.charts?.weeklyBalance || [] },
                  ];
                  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];styles.startWorkoutButton, { marginTop: 8 }]}

                  return (
                    <View style={{ paddingBottom: 20 }}>
                      {metricsData.map((metric, idx) => {
                        const maxVal = Math.max(...metric.chart.slice(0, 7), 1);
                        return (
                          <View key={idx} style={[styles.workoutMetricCard, { marginBottom: 12 }]}>
                            <Text style={styles.workoutMetricLabel}>{metric.label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>e={20} color="#000" />
                              <Text style={[styles.workoutMetricValue, { color: metric.color, fontSize: 24 }]}>{metric.value}</Text>les.startWorkoutButtonText}>Start Workout</Text>
                              <Text style={[styles.workoutUnit, { color: metric.color, fontSize: 14, marginLeft: 4 }]}>{metric.unit}</Text>
                            </View>
                            <View style={styles.workoutChartContainer}>
                              {metric.chart.slice(0, 7).map((val: number, i: number) => {
                                const barHeight = (val / maxVal) * 30;
                                return (
                                  <React.Fragment key={i}>
                                    {i === 0 && (
                                      <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                    )}
                                    <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>ible}
                                      <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: metric.color, borderRadius: 3 }]} />rdModalVisible(false)}
                                      <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>
                                    </View>
                                    <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                  </React.Fragment>
                                ); a fallback if the previous attempt failed.
                              })}DailyData(), 100);
                            </View>
                            <Text style={styles.workoutTodayFooter}>
                              <Text style={{ color: '#8E8E93' }}>Today: </Text>
                              <Text style={{ color: metric.color }}>{metric.todayValue} {metric.unit}</Text>
                            </Text>
                          </View>
                        );
                      })}
                      <TouchableOpacity) => setWorkoutEventDetailVisible(false)}
                        style={[styles.startWorkoutButton, { marginTop: 8 }]}
                        onPress={() => {dColor: '#000' }}>
                          setWorkoutMetricsModalVisible(false);rkoutEvent && (
                          if (workout) {
                            timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
                          }ion: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 }}>
                        }}eOpacity
                        activeOpacity={0.8}style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}
                      >nPress={() => setWorkoutEventDetailVisible(false)}
                        <MaterialCommunityIcons name="play-circle" size={20} color="#000" />
                        <Text style={styles.startWorkoutButtonText}>Start Workout</Text> <Feather name="chevron-left" size={22} color="#FFF" />
                      </TouchableOpacity>   <Text style={{ color: '#FFF', fontSize: 17, marginLeft: 4 }}>
                    </View>      {selectedWorkoutEvent.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  );                    </Text>
                })()}eOpacity>
              </ScrollView>
            </View>
          </View>addingHorizontal: 16, height: 44, justifyContent: 'center' }}
        </Modal>{() => {

        <AddSummaryCardModal
          visible={addCardModalVisible}
          onClose={() => setAddCardModalVisible(false)}
          onCardAdded={() => {        }}
            loadDailyData();        >
            // Force a slight delay to ensure storage consistency if needed,                     <Text style={{ color: '#007AFF', fontSize: 17 }}>Edit</Text>
            // but loadDailyData itself reads from storage. 
            // Setting a timeout as a fallback if the previous attempt failed.  </View>
            setTimeout(() => loadDailyData(), 100);
          }}le={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        />color dot */}
center', marginBottom: 4 }}>
        {/* Workout Event Detail Modal - iOS Calendar Style */}           <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', marginRight: 12 }} />
        <Modal'700', color: '#FFF' }}>{selectedWorkoutEvent.workoutDay}</Text>
          visible={workoutEventDetailVisible}
          animationType="slide"
          presentationStyle="pageSheet"ime */}
          onRequestClose={() => setWorkoutEventDetailVisible(false)}
        >tEvent.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {selectedWorkoutEvent && (Bottom: 20 }}>
              <> {selectedWorkoutEvent.startTime} – {selectedWorkoutEvent.endTime}
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 }}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}le={{ backgroundColor: '#1C1C1E', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    onPress={() => setWorkoutEventDetailVisible(false)}', '11:00'].map((time, index) => (
                  >                      <View key={time} style={{ flexDirection: 'row', alignItems: 'flex-start', height: index === 1 ? 60 : 40 }}>
                    <Feather name="chevron-left" size={22} color="#FFF" />={{ color: '#8E8E93', fontSize: 13, width: 50 }}>{time}</Text>
                    <Text style={{ color: '#FFF', fontSize: 17, marginLeft: 4 }}>3C', marginTop: 8 }}>
                      {selectedWorkoutEvent.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 0 && (
                    </Text>orderRadius: 8, padding: 12, marginTop: 8 }}>
                  </TouchableOpacity>, fontWeight: '600', fontSize: 15 }}>{selectedWorkoutEvent.workoutDay}</Text>
255,255,255,0.8)', fontSize: 13 }}>{selectedWorkoutEvent.startTime} – {selectedWorkoutEvent.endTime}</Text>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 16, height: 44, justifyContent: 'center' }}    )}
                    onPress={() => {     </View>
                      // Edit mode - open calendar to change workout day
                      setWorkoutEventDetailVisible(false);
                      setCalendarInitialViewMode('month');w>
                      setFullCalendarVisible(true);
                    }}
                  >
                    <Text style={{ color: '#007AFF', fontSize: 17 }}>Edit</Text>ttom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  </TouchableOpacity>
                </View>
CalendarInitialViewMode('month');
                <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>                      setFullCalendarVisible(true);
                  {/* Event Title with color dot */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', marginRight: 12 }} />
                    <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFF' }}>{selectedWorkoutEvent.workoutDay}</Text>ew style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', marginRight: 12, paddingBottom: 1 }}>
                  </View>

                  {/* Date & Time */}xt style={{ color: '#FFF', fontSize: 17 }}>Calendar</Text>
                  <Text style={{ fontSize: 15, color: '#8E8E93', marginBottom: 4 }}>                    </View>
                    {selectedWorkoutEvent.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}irection: 'row', alignItems: 'center' }}>
                  </Text>ht: 8 }} />
                  <Text style={{ fontSize: 15, color: '#8E8E93', marginBottom: 20 }}>rginRight: 8 }}>Workout Schedule</Text>
                    {selectedWorkoutEvent.startTime} – {selectedWorkoutEvent.endTime}
                  </Text>

                  {/* Timeline Block */}
                  <View style={{ backgroundColor: '#1C1E1E', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    {['09:00', '10:00', '11:00'].map((time, index) => (
                      <View key={time} style={{ flexDirection: 'row', alignItems: 'flex-start', height: index === 1 ? 60 : 40 }}>
                        <Text style={{ color: '#8E8E93', fontSize: 13, width: 50 }}>{time}</Text>{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1, borderTopWidth: 0.5, borderTopColor: '#3A3A3C', marginTop: 8 }}>w style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          {index === 0 && (her name="bell" size={18} color="#FFF" />
                            <View style={{ backgroundColor: '#FF3B30', borderRadius: 8, padding: 12, marginTop: 8 }}>w>
                              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>{selectedWorkoutEvent.workoutDay}</Text> <Text style={{ color: '#FFF', fontSize: 17 }}>Alert</Text>
                              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{selectedWorkoutEvent.startTime} – {selectedWorkoutEvent.endTime}</Text>iew>
                            </View>                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          )} color: '#8E8E93', fontSize: 15, marginRight: 8 }}>30 minutes before</Text>
                        </View>me="chevron-down" size={16} color="#8E8E93" />
                      </View>
                    ))}
                  </View>
Color: '#3A3A3C', marginVertical: 4 }} />
                  {/* Calendar Row */}
                  <TouchableOpacityiew style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    style={{ backgroundColor: '#1C1E1E', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    onPress={() => {ckgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      setWorkoutEventDetailVisible(false);
                      setCalendarInitialViewMode('month');
                      setFullCalendarVisible(true); style={{ color: '#FFF', fontSize: 17 }}>Second Alert</Text>
                    }}
                  > style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>t: 8 }}>None</Text>
                      <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', marginRight: 12, paddingBottom: 1 }}>
                        <Feather name="calendar" size={18} color="#FFF" />
                      </View>
                      <Text style={{ color: '#FFF', fontSize: 17 }}>Calendar</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>                  {/* Workout Section */}
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF', marginRight: 8 }} />rginTop: 8 }}>
                      <Text style={{ color: '#8E8E93', fontSize: 15, marginRight: 8 }}>Workout Schedule</Text>marginBottom: 16 }}>
                      <Feather name="chevron-down" size={16} color="#8E8E93" />
                    </View>B', borderRadius: 20, overflow: 'hidden' }}>
                  </TouchableOpacity>
ntWeight: '600' }}>−</Text>
                  {/* Alert Row */}ableOpacity>
                  <View style={{ backgroundColor: '#1C1E1E', borderRadius: 12, padding: 16, marginBottom: 12 }}>ertical: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>xt style={{ color: '#FFF', fontSize: 17, fontWeight: '600' }}>+</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <Feather name="bell" size={18} color="#FFF" />
                        </View>
                        <Text style={{ color: '#FFF', fontSize: 17 }}>Alert</Text>kout Cards Grid */}
                      </View>                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#8E8E93', fontSize: 15, marginRight: 8 }}>30 minutes before</Text>                        const SvgIcon = workout.SvgIcon;
                        <Feather name="chevron-down" size={16} color="#8E8E93" />
                      </View>
                    </View>

                    <View style={{ height: 0.5, backgroundColor: '#3A3A3C', marginVertical: 4 }} />idth: '48%',

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}> borderRadius: 16,
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <Feather name="bell-off" size={18} color="#FFF" />
                        </View>}
                        <Text style={{ color: '#FFF', fontSize: 17 }}>Second Alert</Text> onPress={() => {
                      </View>     setWorkoutEventDetailVisible(false);
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>                              timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
                        <Text style={{ color: '#8E8E93', fontSize: 15, marginRight: 8 }}>None</Text>
                        <Feather name="chevron-down" size={16} color="#8E8E93" />
                      </View>
                    </View>
                  </View>

                  {/* Workout Section */}
                  <View style={{ marginTop: 8 }}>or: 'rgba(255, 107, 91, 0.2)',
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFF' }}>Workout</Text>
                      <View style={{ flexDirection: 'row', backgroundColor: '#FF6B5B', borderRadius: 20, overflow: 'hidden' }}> 12
                        <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }}>}>
                          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '600' }}>−</Text>   {SvgIcon && <SvgIcon width={36} height={36} fill="#FF6B5B" />}
                        </TouchableOpacity>                            </View>
                        <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }}>or: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{workout.name}</Text>
                          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '600' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Workout Cards Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>ght: 60 }} />
                      {(allWorkouts || []).map((workout) => {
                        const SvgIcon = workout.SvgIcon;
                        return (
                          <TouchableOpacity
                            key={workout.id}
                            style={{
                              width: '48%',ovider>
                              backgroundColor: '#2C2C2E',
                              borderRadius: 16,
                              padding: 16,
                              alignItems: 'center',te({
                              marginBottom: 12,
                            }}rdModal's cardFront for single grafikli Workout cards
                            onPress={() => {
                              setWorkoutEventDetailVisible(false);
                              timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={{
                              width: 64,
                              height: 64,
                              borderRadius: 32,
                              backgroundColor: 'rgba(255, 107, 91, 0.2)',,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginBottom: 12
                            }}>
                              {SvgIcon && <SvgIcon width={36} height={36} fill="#FF6B5B" />},
                            </View>
                            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{workout.name}</Text>  scrollContent: {
                          </TouchableOpacity>
                        );
                      })}: 120,
                    </View>
                  </View>
bsolute',
                  <View style={{ height: 60 }} />
                </ScrollView>
              </>right: 0,
            )}   flexDirection: 'row',
          </View>    justifyContent: 'space-between',
        </Modal>
      </View>izontal: 16,
    </UnifiedLiquidGlassMenuProvider>
  );Top: 50,
}100,
Color: 'transparent',
const styles = StyleSheet.create({
  cardFront: {
    // Matches AddSummaryCardModal's cardFront for single grafikli Workout cards
    top: 0,oluteFillObject,
    left: 0,
    zIndex: 3,
    position: 'relative',
    width: '100%',
    backgroundColor: '#2A292A',t.absoluteFillObject,
    borderRadius: 16,
    paddingHorizontal: 16,Title: {
    paddingTop: 12,: 'absolute',
    paddingBottom: 8,
    justifyContent: 'space-between',right: 0,
    height: 171,rm.OS === 'ios' ? 12 : 8,
  },'center',
  container: { 'center',
    flex: 1,
    backgroundColor: '#000',
  },leText: {
  scrollContent: {
    padding: 16,e: 17,
    paddingTop: 45,ht: '600',
    paddingBottom: 120,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    zIndex: 100,
    backgroundColor: 'transparent',E8E93',
    overflow: 'visible',// textTransform: 'uppercase', // Removed for mixed case as requested
  },3, // Set to 3px gap as requested
  headerBlurContainer: {
    ...StyleSheet.absoluteFillObject,aderRightContainer: {
    overflow: 'hidden',w',
    zIndex: 0,
  },12,
  headerBlur: {ents: 'auto',
    ...StyleSheet.absoluteFillObject,
  },
  headerCenterTitle: {
    position: 'absolute',
    left: 0,height: 40,
    right: 0,,
    bottom: Platform.OS === 'ios' ? 12 : 8,r: SUMMARY_CARD_BG_COLOR,
    alignItems: 'center',t: 'center',
    justifyContent: 'center',r',
    zIndex: 1,
  },
  stickyTitleText: {C1E',
    color: '#FFF',24, // Updated from 20 to match sectionCard
    fontSize: 17,
    fontWeight: '600',height: 210,
  },
  largeTitleContainer: {{
    paddingHorizontal: 16,',
    paddingTop: 0,: 'flex-start',
    paddingBottom: 16,alignItems: 'center',
  },m: 0,
  headerTitle: {: 6,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerDate: {fontWeight: '600',
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    // textTransform: 'uppercase', // Removed for mixed case as requestednt: {
    marginTop: 3, // Set to 3px gap as requested
  }, 'center',
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',t: 20,
    // gap: 12, 'center',
    pointerEvents: 'auto',center',
    zIndex: 50,
  },
  avatarContainer: {
    width: 40,position: 'absolute',
    height: 40,
    borderRadius: 20,
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',: 15,
  },backgroundColor: '#F9104F',
  activityCard: {: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 24, // Updated from 20 to match sectionCard
    padding: 16,
    height: 210,
  },
  cardHeaderRow: {l: {
    flexDirection: 'row',fontSize: 17,
    justifyContent: 'flex-start',FF',
    alignItems: 'center', 0,
    marginBottom: 0,
    paddingBottom: 6, {
    // gap: 6,: 28,
  },fontWeight: '600',
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',fontWeight: '600',
    flex: 1,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },marginBottom: 10,
  ringContainer: {
    marginRight: 20,
    alignItems: 'center',SquareCardMeasurements.cardWidth,
    justifyContent: 'center',quareCardMeasurements.cardHeight,
    position: 'relative',Color: SUMMARY_CARD_BG_COLOR, // Default for all new cards
  },s: SquareCardMeasurements.borderRadius,
  arrowCircle: {rdMeasurements.padding,
    position: 'absolute',een',
    top: 0,
    left: 55,
    width: 30,fontSize: 12,
    height: 30,
    borderRadius: 15,ttom: 4,
    backgroundColor: '#F9104F',textTransform: 'uppercase',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStats: {',
    flex: 1,marginBottom: 8,
  },
  activityLabel: {
    fontSize: 17,
    color: '#FFF',fontWeight: '500',
    marginBottom: 0,
  },umlu yeni eklenenler
  activityCurrent: {
    fontSize: 28,fontSize: 17,
    fontWeight: '600',600',
  },,
  activityUnit: {
    fontSize: 18,
    fontWeight: '600',
  },fontSize: 13,
  sectionTitle: {FFF',
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 10,
  },
  halfCard: {
    width: SquareCardMeasurements.cardWidth,rkoutUnit: {
    height: SquareCardMeasurements.cardHeight, 20,
    backgroundColor: SUMMARY_CARD_BG_COLOR, // Default for all new cards700',
    borderRadius: SquareCardMeasurements.borderRadius,
    padding: SquareCardMeasurements.padding,
    justifyContent: 'space-between',
  },flexDirection: 'row',
  subLabel: {'flex-end',
    fontSize: 12,t: 'space-between',
    color: '#FFF',
    marginBottom: 4,
    textTransform: 'uppercase',paddingBottom: 6,
  },low: 'hidden',
  metricValue: {
    fontSize: 30,{
    fontWeight: '500',color: '#FFF',
    marginBottom: 8,
  },
  unit: {500',
    fontSize: 22,
    fontWeight: '500',r: {
  },'row',
  // Modal ile uyumlu yeni eklenenleralignItems: 'flex-end',
  workoutCardTitle: {'space-between',
    fontSize: 17,
    fontWeight: '600',0,
    color: '#FFF',lative',
    marginLeft: -4,overflow: 'hidden',
  },
  workoutSubLabel: {lay: {
    fontSize: 13,e',
    color: '#FFF',bottom: 0,
    marginTop: 4,
  },
  workoutMetricValue: {w',
    fontSize: 30,: 'space-between',
    fontWeight: '700',
  },
  workoutUnit: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 2,zontal: 8,
  },l: 2,
  workoutChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',textAlign: 'center',
    justifyContent: 'space-between',
    height: 55,
    marginTop: -2,
    paddingBottom: 6,.5,
    overflow: 'hidden',
  },ctionCard: {
  workoutTodayFooter: {UMMARY_CARD_BG_COLOR,
    color: '#FFF',
    fontSize: 13,
    marginTop: -12,
    fontWeight: '500',om: 2,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',ssionsTitle: {
    justifyContent: 'space-between',
    height: 70,
    marginBottom: 0,FF',
    position: 'relative',
    overflow: 'hidden',
  },
  chartLabelsOverlay: {
    position: 'absolute',alignItems: 'center',
    bottom: 0,: 8,
    left: 0,idth: 1,
    right: 0,: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabelText: {
    fontSize: 10,
    color: '#8E8E93',00',
    backgroundColor: '#2A292A',justifyContent: 'center',
    paddingHorizontal: 8,nItems: 'center',
    paddingVertical: 2,ht: 16,
    borderRadius: 4,
    overflow: 'hidden',ssionInfo: {
    textAlign: 'center',
  },
  bar: { {
    width: 3,
    borderRadius: 1.5,
  },
  sectionCard: {
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderRadius: 24,ssionMetric: {
    paddingTop: 12,
    paddingHorizontal: 16,Colors.energy,
    paddingBottom: 2,
    marginBottom: 0,
    overflow: 'hidden',t: {
  },fontSize: 19,
  sessionsTitle: {cColors.energy,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',14,
    paddingVertical: 8,8E93',
    borderBottomWidth: 1,r',
    borderBottomColor: '#333',
  },
  sessionIconContainer: {
    width: 50,row',
    height: 50,flexWrap: 'wrap',
    borderRadius: 25,nt: 'space-between',
    backgroundColor: '#000',
    justifyContent: 'center',rkoutShortcutCard: {
    alignItems: 'center',H - 32 - 16 - 8) / 2,
    marginRight: 16, 16,
  }, 10,
  sessionInfo: {l: 8,
    flex: 1,column',
  },alignItems: 'flex-start',
  sessionWorkoutName: {r: SUMMARY_CARD_BG_COLOR,
    fontSize: 16,0,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,ortcutName: {
  },,
  sessionMetric: {,
    fontSize: 29,
    color: MetricColors.energy,
    fontWeight: '600',textAlign: 'left',
  },
  sessionUnit: {iner: {
    fontSize: 19,te',
    color: MetricColors.energy,top: -8,
    fontWeight: '700',
  },
  sessionDateLabel: {
    fontSize: 12,
    color: '#8E8E93',A3A3C',
  },justifyContent: 'center',
  emptyText: {'center',
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,width: 48,
  },
  workoutGrid: {
    flexDirection: 'row',center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',,
  },
  workoutShortcutCard: {
    width: (SCREEN_WIDTH - 32 - 16 - 8) / 2,
    borderRadius: 16,
    paddingHorizontal: 10,s: 24,
    paddingVertical: 8,justifyContent: 'center',
    flexDirection: 'column',center',
    alignItems: 'flex-start',
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderWidth: 0,
    height: 80,or: '#2C2C2E',
  },0,
  shortcutName: {
    fontSize: 14,
    color: '#FFF',ARY_CARD_BG_COLOR,
    fontWeight: '700',dius: 30,
    marginTop: 4,16,
    textAlign: 'left',: 'center',
  },
  deleteIconContainer: {xt: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,aderIconContainer: {
    borderRadius: 12,
    backgroundColor: '#3A3A3C',,
    justifyContent: 'center',s: 10,
    alignItems: 'center','#9DEC2C',
    zIndex: 10001,
  },
  headerIconWrapper: {
    width: 48,dalContainer: {
    height: 48,
    borderRadius: 24,Color: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',ent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
  },ARY_CARD_BG_COLOR,
  doneButton: {borderTopLeftRadius: 20,
    width: 48,ightRadius: 20,
    height: 48,tom: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',flexDirection: 'row',
  },pace-between',
  separator: {
    height: 1,
    backgroundColor: '#2C2C2E',Width: 1,
    marginHorizontal: 0,2C2C2E',
  },
  bottomLargeButton: {
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  bottomLargeButtonText: {0,
    fontSize: 17, 'center',
    fontWeight: '600',
    color: '#9DEC2C',
  },
  headerIconContainer: {
    width: 20,borderRadius: 70,
    height: 20, 'center',
    borderRadius: 10,ms: 'center',
    backgroundColor: '#9DEC2C',
    justifyContent: 'center',
    alignItems: 'center',dalMetricValue: {
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },fontWeight: '600',
  modalContent: {',
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,on: {
  },
  modalHeader: {
    flexDirection: 'row',textAlign: 'center',
    justifyContent: 'space-between', 22,
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1, 'row',
    borderBottomColor: '#2C2C2E',marginTop: 20,
  },tical: 20,
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',dalStatItem: {
    color: '#FFF',r',
  },
  modalBody: {: {
    padding: 20,
    alignItems: 'center',
  },
  modalMetricCircle: {
    width: 140,dalStatValue: {
    height: 140,
    borderRadius: 70,700',
    justifyContent: 'center',
    alignItems: 'center',rkoutMetricCard: {
    marginBottom: 20,olor: '#2C2C2E',
  }, 12,
  modalMetricValue: {
    fontSize: 48,al: 4,
    fontWeight: '700',
  },
  modalLabel: {color: '#8E8E93',
    fontSize: 17,
    fontWeight: '600',600',
    color: '#FFF',ppercase',
    marginBottom: 12,
    textAlign: 'center',n: {
  },backgroundColor: '#9DEC2C',
  modalDescription: {s: 12,
    fontSize: 15,
    color: '#8E8E93',tal: 20,
    textAlign: 'center',,
    lineHeight: 22, 'center',
  },justifyContent: 'center',
  modalStats: { 8,
    flexDirection: 'row',
    marginTop: 20,marginHorizontal: 4,
    paddingVertical: 20,
    // gap: 20,tonText: {
  },
  modalStatItem: {
    alignItems: 'center',fontWeight: '700',
  },
  modalStatLabel: {
    fontSize: 13,
    color: '#8E8E93',t TrendSquareCardAnimated = ({ card }: { card: any }) => {
    marginBottom: 4,eRef(new RNAnimated.Value(0)).current;
  },NAnimated.Value(1)).current;
  modalStatValue: {
    fontSize: 24,
    fontWeight: '700',SquareCardStyle.trendSquareCard, { height: '100%', backgroundColor: SUMMARY_CARD_BG_COLOR }]}>
  },  <Text style={TrendsSquareCardStyle.trendSquareHeader}>Trends</Text>
  workoutMetricCard: {ndsSquareCardStyle.trendSquareIconWrapper, { overflow: 'hidden', backgroundColor: '#2A292A' }]}>
    backgroundColor: '#2C2C2E',iew style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
    borderRadius: 12,r name="chevron-down" size={48} color={card.color} />
    padding: 16,iew>
    marginHorizontal: 4,
  },  <Text style={TrendsSquareCardStyle.trendSquareLabel}>{card.title}</Text>
  workoutMetricLabel: {ndsSquareCardStyle.trendSquareValue, { color: card.color }]}>
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  startWorkoutButton: {
    backgroundColor: '#9DEC2C',
    borderRadius: 12,imated = ({ color }: { color: string }) => {
    paddingVertical: 14,
    paddingHorizontal: 20,SquareCardStyle.trendIconDown, { overflow: 'hidden', backgroundColor: '#2A292A' }]}>
    flexDirection: 'row',  <Feather name="chevron-down" size={38} color={color} />
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    // gap: 8,    marginHorizontal: 4,  },  startWorkoutButtonText: {    color: '#000',    fontSize: 16,    fontWeight: '700',  },});const TrendSquareCardAnimated = ({ card }: { card: any }) => {  const slideAnim = useRef(new RNAnimated.Value(0)).current;  const fadeAnim = useRef(new RNAnimated.Value(1)).current;  return (    <View style={[TrendsSquareCardStyle.trendSquareCard, { height: '100%', backgroundColor: SUMMARY_CARD_BG_COLOR }]}>      <Text style={TrendsSquareCardStyle.trendSquareHeader}>Trends</Text>      <View style={[TrendsSquareCardStyle.trendSquareIconWrapper, { overflow: 'hidden', backgroundColor: '#2A292A' }]}>        <RNAnimated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>          <Feather name="chevron-down" size={48} color={card.color} />        </RNAnimated.View>      </View>      <Text style={TrendsSquareCardStyle.trendSquareLabel}>{card.title}</Text>      <Text style={[TrendsSquareCardStyle.trendSquareValue, { color: card.color }]}>        {card.val} {card.unit}      </Text>    </View>  );};const TrendGridIconAnimated = ({ color }: { color: string }) => {  return (
    <View style={[TrendsSquareCardStyle.trendIconDown, { overflow: 'hidden', backgroundColor: '#2A292A' }]}>
      <Feather name="chevron-down" size={38} color={color} />
    </View>
  );
};
