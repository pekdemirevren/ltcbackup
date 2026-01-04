import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface DailyData {
    value: number;
    isToday: boolean;
}

interface ActivityCardProps {
    iconName: string;
    title: string;
    weeklyDistance: number;
    unit: string;
    todayDistance: number;
    dailyData: DailyData[];
}

const BarChart: React.FC<{ data: DailyData[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(item => item.value), 1); // Avoid division by zero
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <View style={styles.chartContainer}>
            {data.map((item, index) => {
                const barHeight = (item.value / maxValue) * 60;
                return (
                    <View key={index} style={styles.barWrapper}>
                        <View style={[styles.bar, { height: barHeight, backgroundColor: item.isToday ? '#4caf50' : '#007AFF' }]} />
                        <Text style={styles.dayLabel}>{days[index]}</Text>
                    </View>
                );
            })}
        </View>
    );
};

const ActivityCard: React.FC<ActivityCardProps> = ({
    iconName,
    title,
    weeklyDistance,
    unit,
    todayDistance,
    dailyData
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Icon name={iconName} size={20} color="#fff" style={styles.icon} />
                <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.subtitle}>Weekly Distance</Text>
            <Text style={styles.distance}>
                {weeklyDistance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <Text style={styles.unitText}>{unit}</Text>
            </Text>
            <BarChart data={dailyData} />
            <Text style={styles.todayText}>
                Today: {todayDistance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {unit}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#2C2C2E',
        borderRadius: 20,
        padding: 20,
        marginVertical: 10,
        width: '94%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#EBEBF599',
        fontSize: 14,
        marginTop: 12,
    },
    distance: {
        color: '#007AFF',
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 4,
    },
    unitText: {
        fontSize: 18,
        marginLeft: 4,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 80,
        marginTop: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EBEBF54D',
        paddingBottom: 10,
    },
    barWrapper: {
        alignItems: 'center',
        width: '12%',
        justifyContent: 'flex-end',
        height: '100%',
    },
    bar: {
        width: 8,
        borderRadius: 4,
    },
    dayLabel: {
        color: '#EBEBF599',
        fontSize: 11,
        marginTop: 6,
    },
    todayText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 12,
        fontWeight: '500',
    },
});

export default ActivityCard;
