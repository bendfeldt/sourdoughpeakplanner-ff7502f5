import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { SourdoughPersona, FlourBlendItem, FeedingRatio, PersonaTimeSettings } from '@/types/sourdough';
import { FLOUR_DATA, generateId } from '@/lib/sourdough-calculator';

const PERSONAS_KEY = 'sourdough-personas';
const ACTIVE_PERSONA_KEY = 'sourdough-active-persona';

// Local date, not UTC (toISOString)
const formatDateString = (date: Date): string => format(date, 'yyyy-MM-dd');
const formatTimeString = (date: Date): string => date.toTimeString().slice(0, 5);

export function createDefaultTimeSettings(): PersonaTimeSettings {
  const now = new Date();
  const peakStart = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const peakEnd = new Date(now.getTime() + 10 * 60 * 60 * 1000);
  const peakTarget = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  return {
    inputMode: 'basic',
    targetStartDate: formatDateString(now),
    targetStartTime: formatTimeString(now),
    targetPeakStartDate: formatDateString(peakStart),
    targetPeakStartTime: formatTimeString(peakStart),
    targetPeakEndDate: formatDateString(peakEnd),
    targetPeakEndTime: formatTimeString(peakEnd),
    targetPeakDate: formatDateString(peakTarget),
    targetPeakTime: formatTimeString(peakTarget),
    targetTotalSourdough: 200,
    targetTotalSourdoughInput: '200',
  };
}

export function createDefaultPersona(name: string = 'My Starter'): SourdoughPersona {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    flourBlend: [
      { id: generateId(), flourType: 'bread-flour', percentage: 100, proteinContent: FLOUR_DATA['bread-flour'].baseProtein }
    ],
    feedingRatio: { starter: 1, flour: 1, water: 1 },
    ratioInputs: { starter: '1', flour: '1', water: '1' },
    temperature: 24,
    oldSourdoughAmount: 50,
    oldSourdoughInput: '50',
    isSweetMode: false,
    sugarPercentage: 5,
    sugarType: 'white-sugar',
    timeSettings: createDefaultTimeSettings(),
    createdAt: now,
    updatedAt: now,
  };
}

export function usePersonas() {
  const [personas, setPersonas] = useState<SourdoughPersona[]>(() => {
    if (typeof window === 'undefined') return [createDefaultPersona()];
    
    try {
      const stored = localStorage.getItem(PERSONAS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load personas:', e);
    }
    return [createDefaultPersona()];
  });

  const [activePersonaId, setActivePersonaId] = useState<string>(() => {
    if (typeof window === 'undefined') return personas[0]?.id || '';
    
    try {
      const stored = localStorage.getItem(ACTIVE_PERSONA_KEY);
      if (stored && personas.some(p => p.id === stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to load active persona:', e);
    }
    return personas[0]?.id || '';
  });

  // Persist personas
  useEffect(() => {
    try {
      localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
    } catch (e) {
      console.warn('Failed to save personas:', e);
    }
  }, [personas]);

  // Persist active persona
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PERSONA_KEY, activePersonaId);
    } catch (e) {
      console.warn('Failed to save active persona:', e);
    }
  }, [activePersonaId]);

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];

  const addPersona = useCallback((name: string) => {
    const newPersona = createDefaultPersona(name);
    setPersonas(prev => [...prev, newPersona]);
    setActivePersonaId(newPersona.id);
    return newPersona;
  }, []);

  const deletePersona = useCallback((id: string) => {
    setPersonas(prev => {
      if (prev.length <= 1) return prev; // Keep at least one
      const filtered = prev.filter(p => p.id !== id);
      if (activePersonaId === id) {
        setActivePersonaId(filtered[0]?.id || '');
      }
      return filtered;
    });
  }, [activePersonaId]);

  const updatePersona = useCallback((id: string, updates: Partial<SourdoughPersona>) => {
    setPersonas(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    ));
  }, []);

  const renamePersona = useCallback((id: string, name: string) => {
    updatePersona(id, { name });
  }, [updatePersona]);

  // Auto-save function that updates the active persona with current values
  const autoSavePersona = useCallback((
    id: string,
    data: Partial<SourdoughPersona>
  ) => {
    setPersonas(prev => prev.map(p => 
      p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
    ));
  }, []);

  const duplicatePersona = useCallback((id: string, newName: string) => {
    const source = personas.find(p => p.id === id);
    if (!source) return null;
    
    const now = Date.now();
    const newPersona: SourdoughPersona = {
      ...source,
      id: generateId(),
      name: newName,
      flourBlend: source.flourBlend.map(f => ({ ...f, id: generateId() })),
      timeSettings: { ...source.timeSettings },
      createdAt: now,
      updatedAt: now,
    };
    
    setPersonas(prev => [...prev, newPersona]);
    setActivePersonaId(newPersona.id);
    return newPersona;
  }, [personas]);

  // Migrate old personas that don't have timeSettings
  useEffect(() => {
    const needsMigration = personas.some(p => !p.timeSettings);
    if (needsMigration) {
      setPersonas(prev => prev.map(p => 
        p.timeSettings ? p : { ...p, timeSettings: createDefaultTimeSettings(), sugarType: p.sugarType || 'white-sugar' }
      ));
    }
  }, []);

  return {
    personas,
    activePersona,
    activePersonaId,
    setActivePersonaId,
    addPersona,
    deletePersona,
    updatePersona,
    renamePersona,
    autoSavePersona,
    duplicatePersona,
  };
}