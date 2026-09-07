import { useRef, useEffect, useMemo } from 'react';
import { useCalendarStore } from './useCalendarStore';
import { CalendarConfig } from '../config/CalendarConfig';
import { getDaysInMonth, getWeeksFromDays } from '../utils/dateUtils';
import { MonthInfo, WeekInfo } from '../models/Event';

export const useInfiniteScroll = () => {
    const {
        bufferStart,
        bufferEnd,
        bufferStage,
        setBufferStart,
        setBufferEnd,
        setBufferStage,
    } = useCalendarStore();

    const pendingScrollCompensation = useRef<number>(0);

    // Fixed anchor: today's month
    const anchorMonth = useMemo(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }, []);

    // Generate month buffer based on current range
    const monthWeeksInfo: MonthInfo[] = useMemo(() => {
        const info: MonthInfo[] = [];
        for (let i = bufferStart; i <= bufferEnd; i++) {
            const date = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + i, 1);
            const w = getWeeksFromDays(getDaysInMonth(date));
            info.push({
                weeks: w,
                month: date.getMonth(),
                year: date.getFullYear(),
                monthKey: `month-${date.getFullYear()}-${date.getMonth()}`,
                bufferIdx: i
            });
        }
        return info;
    }, [anchorMonth, bufferStart, bufferEnd]);

    // Flatten weeks for rendering
    const allBufferedWeeks: WeekInfo[] = useMemo(() => {
        const weeksList: WeekInfo[] = [];
        let globalIdx = 0;
        monthWeeksInfo.forEach(m => {
            m.weeks.forEach(w => {
                weeksList.push({ week: w, monthKey: m.monthKey, globalIdx, bufferIdx: m.bufferIdx });
                globalIdx++;
            });
        });
        return weeksList;
    }, [monthWeeksInfo]);

    // Calculate offset to center on anchor month
    const centerOffsetWeeks = useMemo(() => {
        let count = 0;
        const anchorIndex = -bufferStart;
        for (let i = 0; i < anchorIndex; i++) {
            count += monthWeeksInfo[i]?.weeks.length || 0;
        }
        return count;
    }, [monthWeeksInfo, bufferStart]);

    // Progressive buffer expansion on mount
    useEffect(() => {
        const stage1 = setTimeout(() => setBufferStage(1), 300);
        const stage2 = setTimeout(() => setBufferStage(3), 800);

        return () => {
            clearTimeout(stage1);
            clearTimeout(stage2);
        };
    }, [setBufferStage]);

    // Handle scroll end and expand buffer if needed
    const handleScrollEnd = (monthIdx: number, currentOffset: number) => {
        const { expansionThreshold, expansionAmount, maxRange } = CalendarConfig.buffer;

        // Near top: expand buffer upward
        if (monthIdx !== -1 && monthIdx <= expansionThreshold && bufferStart > -maxRange) {
            const newStart = Math.max(-maxRange, bufferStart - expansionAmount);

            // Calculate weeks being added for scroll compensation
            let weeksToAdd = 0;
            for (let i = newStart; i < bufferStart; i++) {
                const date = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + i, 1);
                weeksToAdd += getWeeksFromDays(getDaysInMonth(date)).length;
            }

            pendingScrollCompensation.current = currentOffset + (weeksToAdd * CalendarConfig.heights.weekRow);
            setBufferStart(newStart);
        }

        // Near bottom: expand buffer downward
        if (monthIdx !== -1 && monthIdx >= monthWeeksInfo.length - expansionThreshold - 1 && bufferEnd < maxRange) {
            const newEnd = Math.min(maxRange, bufferEnd + expansionAmount);
            setBufferEnd(newEnd);
        }
    };

    return {
        anchorMonth,
        monthWeeksInfo,
        allBufferedWeeks,
        centerOffsetWeeks,
        bufferStart,
        bufferEnd,
        bufferStage,
        pendingScrollCompensation,
        handleScrollEnd,
    };
};
