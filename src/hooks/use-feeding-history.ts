import { useState, useEffect, useCallback, createContext, createElement, useContext, type ReactNode } from 'react';
import { generateId } from '@/lib/sourdough-calculator';
import type { FlourBlendItem, FeedingRatio } from '@/types/sourdough';

const HISTORY_KEY = 'sourdough-feeding-history';
const MAX_HISTORY_ENTRIES = 50;

export interface FeedingHistoryEntry {
  id: string;
  personaId: string;
  personaName: string;
  feedingTime: string; // ISO string
  predictedPeakTime: string; // ISO string
  actualPeakTime: string | null; // ISO string, null if not recorded
  temperature: number;
  feedingRatio: FeedingRatio;
  flourBlend: FlourBlendItem[];
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  sugarAmount: number;
  notes: string;
  createdAt: number;
  // Calibration multiplier the prediction used; absent on entries logged before it existed
  calibrationFactor?: number;
  // Calculated accuracy metrics
  peakTimeDifferenceMinutes: number | null; // positive = peaked later than predicted
}

function useFeedingHistoryState() {
  const [history, setHistory] = useState<FeedingHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load feeding history:', e);
    }
    return [];
  });

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save feeding history:', e);
    }
  }, [history]);

  const addEntry = useCallback((entry: Omit<FeedingHistoryEntry, 'id' | 'createdAt' | 'peakTimeDifferenceMinutes'>) => {
    const newEntry: FeedingHistoryEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now(),
      peakTimeDifferenceMinutes: null,
    };
    
    setHistory(prev => {
      const updated = [newEntry, ...prev];
      // Keep only the most recent entries
      return updated.slice(0, MAX_HISTORY_ENTRIES);
    });
    
    return newEntry;
  }, []);

  const recordActualPeak = useCallback((entryId: string, actualPeakTime: Date) => {
    setHistory(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      
      const predicted = new Date(entry.predictedPeakTime).getTime();
      const actual = actualPeakTime.getTime();
      const differenceMinutes = Math.round((actual - predicted) / (1000 * 60));
      
      return {
        ...entry,
        actualPeakTime: actualPeakTime.toISOString(),
        peakTimeDifferenceMinutes: differenceMinutes,
      };
    }));
  }, []);

  const updateNotes = useCallback((entryId: string, notes: string) => {
    setHistory(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, notes } : entry
    ));
  }, []);

  const deleteEntry = useCallback((entryId: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== entryId));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getEntriesForPersona = useCallback((personaId: string) => {
    return history.filter(entry => entry.personaId === personaId);
  }, [history]);

  // Calculate average prediction accuracy for a persona
  const getAccuracyStats = useCallback((personaId: string) => {
    const entries = history.filter(
      entry => entry.personaId === personaId && entry.peakTimeDifferenceMinutes !== null
    );
    
    if (entries.length === 0) return null;
    
    const differences = entries.map(e => e.peakTimeDifferenceMinutes!);
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    const absAvgDifference = differences.map(Math.abs).reduce((a, b) => a + b, 0) / differences.length;
    
    return {
      count: entries.length,
      avgDifferenceMinutes: Math.round(avgDifference),
      avgAbsDifferenceMinutes: Math.round(absAvgDifference),
      // Positive = tends to peak later than predicted
      tendencyMinutes: Math.round(avgDifference),
    };
  }, [history]);

  return {
    history,
    addEntry,
    recordActualPeak,
    updateNotes,
    deleteEntry,
    clearHistory,
    getEntriesForPersona,
    getAccuracyStats,
  };
}

type FeedingHistoryContextValue = ReturnType<typeof useFeedingHistoryState>;

const FeedingHistoryContext = createContext<FeedingHistoryContextValue | null>(null);

/**
 * One shared history for the whole app. Each component used to keep its own copy, so a
 * feed logged in one did not show in the other, and saving the stale copy deleted it.
 */
export function FeedingHistoryProvider({ children }: { children: ReactNode }) {
  return createElement(FeedingHistoryContext.Provider, { value: useFeedingHistoryState() }, children);
}

export function useFeedingHistory(): FeedingHistoryContextValue {
  const value = useContext(FeedingHistoryContext);
  if (!value) throw new Error('useFeedingHistory must be used inside <FeedingHistoryProvider>');
  return value;
}
