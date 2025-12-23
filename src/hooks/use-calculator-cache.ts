import { useState, useEffect, useCallback } from 'react';
import { FlourBlendItem, FeedingRatio, FlourType, FLOUR_DATA, generateId } from '@/lib/sourdough-calculator';

export type DoughMethod = 'direct' | 'autolyse' | 'fermentolyse';

export interface CalculatorCache {
  flourBlend: FlourBlendItem[];
  feedingRatio: FeedingRatio;
  ratioInputs: { starter: string; flour: string; water: string };
  temperature: number;
  oldSourdoughAmount: number;
  oldSourdoughInput: string;
  isSweetMode: boolean;
  sugarPercentage: number;
  sweetFlourType: FlourType;
  useTargetWindow: boolean;
  targetStartTime: string;
  targetPeakStartTime: string;
  targetPeakEndTime: string;
  doughMethod: DoughMethod;
  language: 'en' | 'da';
  isDarkMode: boolean;
}

const CACHE_KEY = 'sourdough-calculator-cache';

const getDefaultCache = (): CalculatorCache => ({
  flourBlend: [
    { id: generateId(), flourType: 'bread-flour', percentage: 100, proteinContent: FLOUR_DATA['bread-flour'].baseProtein }
  ],
  feedingRatio: { starter: 1, flour: 1, water: 1 },
  ratioInputs: { starter: '1', flour: '1', water: '1' },
  temperature: 24,
  oldSourdoughAmount: 50,
  oldSourdoughInput: '50',
  isSweetMode: false,
  sugarPercentage: 10,
  sweetFlourType: 'bread-flour',
  useTargetWindow: false,
  targetStartTime: '',
  targetPeakStartTime: '',
  targetPeakEndTime: '',
  doughMethod: 'direct',
  language: 'en',
  isDarkMode: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : false,
});

export function useCalculatorCache() {
  const [cache, setCache] = useState<CalculatorCache>(() => {
    if (typeof window === 'undefined') return getDefaultCache();
    
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new fields
        return { ...getDefaultCache(), ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load calculator cache:', e);
    }
    return getDefaultCache();
  });

  // Save to localStorage whenever cache changes
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Failed to save calculator cache:', e);
    }
  }, [cache]);

  const updateCache = useCallback((updates: Partial<CalculatorCache>) => {
    setCache(prev => ({ ...prev, ...updates }));
  }, []);

  const resetCache = useCallback(() => {
    setCache(getDefaultCache());
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return { cache, updateCache, resetCache };
}
