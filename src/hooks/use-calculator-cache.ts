import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'sourdough-calculator-settings';

export interface CalculatorSettings {
  language: 'en' | 'da';
  isDarkMode: boolean;
  useTargetWindow: boolean;
  targetStartDate: string; // ISO date string YYYY-MM-DD
  targetStartTime: string; // HH:MM
  targetPeakStartDate: string;
  targetPeakStartTime: string;
  targetPeakEndDate: string;
  targetPeakEndTime: string;
}

const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatTimeString = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

const getDefaultSettings = (): CalculatorSettings => {
  const now = new Date();
  // Default peak window: 8 hours from now for 2 hours
  const peakStart = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const peakEnd = new Date(now.getTime() + 10 * 60 * 60 * 1000);
  
  return {
    language: 'en',
    isDarkMode: typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches 
      : false,
    useTargetWindow: false,
    targetStartDate: formatDateString(now),
    targetStartTime: formatTimeString(now),
    targetPeakStartDate: formatDateString(peakStart),
    targetPeakStartTime: formatTimeString(peakStart),
    targetPeakEndDate: formatDateString(peakEnd),
    targetPeakEndTime: formatTimeString(peakEnd),
  };
};

export function useCalculatorSettings() {
  const [settings, setSettings] = useState<CalculatorSettings>(() => {
    if (typeof window === 'undefined') return getDefaultSettings();
    
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        const defaults = getDefaultSettings();
        // Only use stored date/time values if they're not empty strings
        return { 
          ...defaults, 
          ...parsed,
          // Keep current session time defaults if stored values are empty
          targetStartDate: parsed.targetStartDate || defaults.targetStartDate,
          targetStartTime: parsed.targetStartTime || defaults.targetStartTime,
          targetPeakStartDate: parsed.targetPeakStartDate || defaults.targetPeakStartDate,
          targetPeakStartTime: parsed.targetPeakStartTime || defaults.targetPeakStartTime,
          targetPeakEndDate: parsed.targetPeakEndDate || defaults.targetPeakEndDate,
          targetPeakEndTime: parsed.targetPeakEndTime || defaults.targetPeakEndTime,
        };
      }
    } catch (e) {
      console.warn('Failed to load calculator settings:', e);
    }
    return getDefaultSettings();
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save calculator settings:', e);
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<CalculatorSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
  }, []);

  return { settings, updateSettings, resetSettings };
}
