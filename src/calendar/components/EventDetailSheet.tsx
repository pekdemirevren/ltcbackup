import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Event } from '../models/Event';
import { WORKOUT_DAY_COLORS } from '../../utils/WorkoutDayManager';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../../components/LiquidGlass';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALERT_OPTIONS = [
    { label: 'None', value: 0 },
    { label: 'At time of event', value: 1 },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
    { label: '2 days before', value: 2880 },
];

interface EventDetailSheetProps {
    visible: boolean;
    event: Event | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onWorkoutPress: (workout: any) => void;
    formatHeaderDate: (date: string | Date | undefined) => string;
    formatEventDetailDate: (date: string | Date | undefined) => string;
    getAlertLabel: (minutes?: number) => string;
    workoutCards: any[];
    calendarPermission: boolean;
    deviceCalendars: any[];
    loadingCalendars?: boolean;
    onCalendarSelect: (calendarId: string) => void;
    onAlertChange: (minutes: number) => void;
    onSecondAlertChange: (minutes: number) => void;
    onDeleteThisEventOnly: () => void;
    onDeleteAllFutureEvents: () => void;
}

export const EventDetailSheet = ({
    visible,
    event,
    onClose,
    onEdit,
    onDelete,
    onWorkoutPress,
    formatHeaderDate,
    formatEventDetailDate,
    getAlertLabel,
    workoutCards,
    calendarPermission,
    deviceCalendars,
    loadingCalendars = false,
    onCalendarSelect,
    onAlertChange,
    onSecondAlertChange,
    onDeleteThisEventOnly,
    onDeleteAllFutureEvents,
}: EventDetailSheetProps) => {
    const translateX = useSharedValue(SCREEN_WIDTH);
    const [showCalendarMenu, setShowCalendarMenu] = useState(false);
    const [showAlertMenu, setShowAlertMenu] = useState(false);
    const [showSecondAlertMenu, setShowSecondAlertMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Menu positions
    const [calendarMenuPos, setCalendarMenuPos] = useState({ top: 0, right: 20 });
    const [alertMenuPos, setAlertMenuPos] = useState({ top: 0, right: 20 });
    const [secondAlertMenuPos, setSecondAlertMenuPos] = useState({ top: 0, right: 20 });
    const [deleteMenuPos, setDeleteMenuPos] = useState({ top: 0, right: 20 });

    const calendarRef = useRef<any>(null);
    const alertRef = useRef<any>(null);
    const secondAlertRef = useRef<any>(null);
    const deleteRef = useRef<any>(null);

    useEffect(() => {
        if (visible) {
            translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        } else {
            translateX.value = withSpring(SCREEN_WIDTH, { damping: 20, stiffness: 90 });
            // Close any open sub-modals when sheet closes
            setShowCalendarMenu(false);
            setShowAlertMenu(false);
            setShowSecondAlertMenu(false);
            setShowDeleteModal(false);
        }
    }, [visible]);

    const startX = useSharedValue(0);
    const panGesture = Gesture.Pan()
        .onStart(() => {
            startX.value = translateX.value;
        })
        .onUpdate((e) => {
            if (e.translationX > 0) {
                translateX.value = startX.value + e.translationX;
            }
        })
        .onEnd((e) => {
            if (e.translationX > 100 || e.velocityX > 500) {
                translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
                    runOnJS(onClose)();
                });
            } else {
                translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    if (!event) return null;

    const startHour = parseInt((event.startTime || '09:00').split(':')[0]);
    const startMin = parseInt((event.startTime || '09:00').split(':')[1]);
    const endHour = parseInt((event.endTime || '10:00').split(':')[0]);
    const endMin = parseInt((event.endTime || '10:00').split(':')[1]);
    const HOUR_HEIGHT = 50;
    const LINE_OFFSET = 8;
    const hoursToShow: number[] = [];
    for (let h = startHour; h <= endHour + 1; h++) {
        hoursToShow.push(h % 24);
    }
    const startOffset = (startMin / 60) * HOUR_HEIGHT;
    const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
    const eventHeight = (durationMinutes / 60) * HOUR_HEIGHT;
    const eventColor = event.workoutDay ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#4A90D9';

    const handleOpenCalendar = () => {
        calendarRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            setCalendarMenuPos({ top: y + height + 8, right: 20 });
            setShowCalendarMenu(true);
        });
    };

    const handleOpenAlert = () => {
        alertRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            setAlertMenuPos({ top: y + height + 8, right: 20 });
            setShowAlertMenu(true);
        });
    };

    const handleOpenSecondAlert = () => {
        secondAlertRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            setSecondAlertMenuPos({ top: y + height + 8, right: 20 });
            setShowSecondAlertMenu(true);
        });
    };

    const handleOpenDelete = () => {
        deleteRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            setDeleteMenuPos({ top: y - 180, right: 20 }); // Position above button
            setShowDeleteModal(true);
        });
    };

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.fullScreenContainer, animatedStyle]}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.circularIconButton} onPress={onClose}>
                            <Feather name="chevron-left" size={22} color="#FFF" />
                            <Text style={styles.backButtonText}>{formatHeaderDate(event.date)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.circularIconButton} onPress={onEdit}>
                            <Feather name="edit-2" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.dateText}>{formatEventDetailDate(event.date)}</Text>
                        <Text style={styles.timeText}>{event.startTime || '09:00'} – {event.endTime || '10:00'}</Text>

                        {/* Timeline Block */}
                        <View style={styles.timelineContainer}>
                            {hoursToShow.map((hour, index) => {
                                const isLastRow = index === hoursToShow.length - 1;
                                return (
                                    <View key={`${hour}-${index}`} style={[styles.hourRow, { height: isLastRow ? 16 : HOUR_HEIGHT }]}>
                                        <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
                                        <View style={styles.hourSeparator} />
                                    </View>
                                );
                            })}
                            <View style={[
                                styles.eventBlock,
                                {
                                    backgroundColor: eventColor,
                                    position: 'absolute',
                                    left: 16 + 50 + 10,
                                    right: 16,
                                    top: 24 + LINE_OFFSET + startOffset,
                                    height: eventHeight,
                                }
                            ]}>
                                <Text style={styles.eventBlockTitle}>{event.title}</Text>
                                <View style={styles.eventBlockTimeRow}>
                                    <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.eventBlockTime}>{event.startTime || '09:00'} – {event.endTime || '10:00'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Settings Container */}
                        <View style={styles.settingsButtonsContainer}>
                            <SettingRow
                                innerRef={calendarRef}
                                label="Calendar"
                                value={!calendarPermission ? 'Tap to access' : deviceCalendars.find(c => c.id === event.calendar)?.title || 'Default'}
                                onPress={handleOpenCalendar}
                            />
                            <View style={styles.settingSeparator} />
                            <SettingRow
                                innerRef={alertRef}
                                label="Alert"
                                value={getAlertLabel(event.alertMinutes)}
                                onPress={handleOpenAlert}
                            />
                            <View style={styles.settingSeparator} />
                            <SettingRow
                                innerRef={secondAlertRef}
                                label="Second Alert"
                                value={getAlertLabel(event.secondAlertMinutes)}
                                onPress={handleOpenSecondAlert}
                            />
                        </View>

                        {/* Workouts Section */}
                        {workoutCards.length > 0 && (
                            <View style={styles.workoutsSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>Workouts</Text>
                                    <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                                </View>
                                <View style={styles.workoutGrid}>
                                    {workoutCards.slice(0, 4).map((workout) => (
                                        <TouchableOpacity key={workout.workoutId} style={styles.workoutCard} onPress={() => onWorkoutPress(workout)}>
                                            <View style={[styles.cardIconContainer, { backgroundColor: eventColor + '30' }]}>
                                                {workout.SvgIcon && <workout.SvgIcon width={40} height={40} fill={eventColor} />}
                                            </View>
                                            <Text style={styles.cardTitle} numberOfLines={2}>{workout.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.deleteButtonContainer}>
                            <TouchableOpacity
                                ref={deleteRef}
                                onPress={handleOpenDelete}
                                style={styles.deleteButton}
                            >
                                <Text style={styles.deleteButtonText}>Delete Workout</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>

                {/* Sub-Modals */}
                <SubMenu
                    visible={showCalendarMenu}
                    onClose={() => setShowCalendarMenu(false)}
                    position={calendarMenuPos}
                >
                    <LiquidGlassCard borderRadius={28} width={260}>
                        {loadingCalendars ? (
                            <LiquidGlassMenuItem label="Loading calendars..." onPress={() => { }} />
                        ) : deviceCalendars.length === 0 ? (
                            <LiquidGlassMenuItem label="No calendars found" onPress={() => setShowCalendarMenu(false)} />
                        ) : (
                            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                {deviceCalendars.map((calendar) => (
                                    <LiquidGlassMenuItem
                                        key={calendar.id}
                                        icon={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: calendar.color }} />}
                                        label={calendar.title}
                                        onPress={() => { onCalendarSelect(calendar.id); setShowCalendarMenu(false); }}
                                        iconWidth={20}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </LiquidGlassCard>
                </SubMenu>

                <SubMenu
                    visible={showAlertMenu}
                    onClose={() => setShowAlertMenu(false)}
                    position={alertMenuPos}
                >
                    <LiquidGlassCard borderRadius={28} width={260}>
                        <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                            {ALERT_OPTIONS.map((opt) => (
                                <LiquidGlassMenuItem
                                    key={opt.value}
                                    icon={event.alertMinutes === opt.value ? <MaterialCommunityIcons name="check" size={20} color="#9DEC2C" /> : undefined}
                                    label={opt.label}
                                    onPress={() => { onAlertChange(opt.value); setShowAlertMenu(false); }}
                                />
                            ))}
                        </ScrollView>
                    </LiquidGlassCard>
                </SubMenu>

                <SubMenu
                    visible={showSecondAlertMenu}
                    onClose={() => setShowSecondAlertMenu(false)}
                    position={secondAlertMenuPos}
                >
                    <LiquidGlassCard borderRadius={28} width={260}>
                        <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                            {ALERT_OPTIONS.map((opt) => (
                                <LiquidGlassMenuItem
                                    key={opt.value}
                                    icon={event.secondAlertMinutes === opt.value ? <MaterialCommunityIcons name="check" size={20} color="#9DEC2C" /> : undefined}
                                    label={opt.label}
                                    onPress={() => { onSecondAlertChange(opt.value); setShowSecondAlertMenu(false); }}
                                />
                            ))}
                        </ScrollView>
                    </LiquidGlassCard>
                </SubMenu>

                <SubMenu
                    visible={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    position={deleteMenuPos}
                >
                    <LiquidGlassCard borderRadius={28} width={260}>
                        <LiquidGlassMenuItem label="Delete This Event Only" textColor="#FF3B30" textAlign="center" onPress={() => { onDeleteThisEventOnly(); setShowDeleteModal(false); }} />
                        {event.workoutDay && (
                            <LiquidGlassMenuItem label="Delete All Future Events" textColor="#FF3B30" textAlign="center" onPress={() => { onDeleteAllFutureEvents(); setShowDeleteModal(false); }} />
                        )}
                        <LiquidGlassMenuItem label="Cancel" textAlign="center" onPress={() => setShowDeleteModal(false)} />
                    </LiquidGlassCard>
                </SubMenu>
            </Animated.View>
        </GestureDetector>
    );
};

const SettingRow = ({ label, value, onPress, innerRef }: any) => (
    <View style={styles.settingButtonRow}>
        <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>{label}</Text>
        </View>
        <TouchableOpacity ref={innerRef} style={styles.settingValueRow} onPress={onPress}>
            <Text style={styles.settingValue}>{value}</Text>
            <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
    </View>
);

const SubMenu = ({ visible, onClose, position, children }: any) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.8, { duration: 150 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    if (!visible && opacity.value === 0) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay} />
            </TouchableWithoutFeedback>
            <Animated.View style={[styles.subMenuWrapper, { top: position.top, right: position.right, }, animatedStyle]}>
                {children}
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 12,
    },
    circularIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
        gap: 4,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    eventTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 2,
    },
    timeText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 20,
    },
    timelineContainer: {
        backgroundColor: 'transparent',
        paddingTop: 24,
        paddingHorizontal: 0,
        paddingBottom: 16,
        marginBottom: 16,
        position: 'relative',
    },
    hourRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    hourLabel: {
        width: 50,
        fontSize: 12,
        color: '#8E8E93',
    },
    hourSeparator: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3A3A3C',
        marginLeft: 10,
        marginTop: 8,
    },
    eventBlock: {
        borderRadius: 6,
        padding: 10,
        zIndex: 1,
    },
    eventBlockTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    eventBlockTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    eventBlockTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    settingsButtonsContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
    },
    settingButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
    },
    settingLabelContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 17,
        color: '#FFF',
    },
    settingValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    settingValue: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.6)',
    },
    settingSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#38383A',
        marginLeft: 16,
    },
    workoutsSection: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    seeAllText: {
        fontSize: 16,
        color: '#4A90D9',
    },
    workoutGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    workoutCard: {
        width: (SCREEN_WIDTH - 32 - 12) / 2, // 2 columns
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 12,
    },
    cardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    deleteButtonContainer: {
        marginTop: 12,
    },
    deleteButton: {
        height: 50,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 17,
        color: '#FF3B30',
        fontWeight: '600',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    subMenuWrapper: {
        position: 'absolute',
        zIndex: 1100,
    },
});
