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

const getDefaultSettings = (): CalculatorSettings => ({
  language: 'en',
  isDarkMode: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : false,
  useTargetWindow: false,
  targetStartDate: '',
  targetStartTime: '',
  targetPeakStartDate: '',
  targetPeakStartTime: '',
  targetPeakEndDate: '',
  targetPeakEndTime: '',
});

export function useCalculatorSettings() {
  const [settings, setSettings] = useState<CalculatorSettings>(() => {
    if (typeof window === 'undefined') return getDefaultSettings();
    
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...getDefaultSettings(), ...parsed };
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
    setSettings(getDefaultSettings());
    localStorage.removeItem(SETTINGS_KEY);
  }, []);

  return { settings, updateSettings, resetSettings };
}
