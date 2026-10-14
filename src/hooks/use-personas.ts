import { useState, useEffect, useCallback, createContext, createElement, useContext, type ReactNode } from 'react';
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
  const peakTarget = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  return {
    inputMode: 'basic',
    targetStartDate: formatDateString(now),
    targetStartTime: formatTimeString(now),
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

/** Starters saved by an older version, brought up to date. */
function migratePersonas(list: SourdoughPersona[]): SourdoughPersona[] {
  return list.map(p => {
    // Starters saved before time settings existed get the defaults
    if (!p.timeSettings) return { ...p, timeSettings: createDefaultTimeSettings(), sugarType: p.sugarType || 'white-sugar' };
    // Target Window mode was replaced by Weights mode; the grams come from the saved ratio and starter amount
    if ((p.timeSettings.inputMode as string) === 'target-window') return { ...p, timeSettings: { ...p.timeSettings, inputMode: 'weights' } };
    return p;
  });
}

/** Saved starters, or null if there are none or they can't be read. */
function parsePersonas(stored: string | null): SourdoughPersona[] | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return migratePersonas(parsed);
  } catch (e) {
    console.warn('Failed to load personas:', e);
    return null;
  }
}

function usePersonasState() {
  const [personas, setPersonas] = useState<SourdoughPersona[]>(() => {
    if (typeof window === 'undefined') return [createDefaultPersona()];
    try {
      return parsePersonas(localStorage.getItem(PERSONAS_KEY)) ?? [createDefaultPersona()];
    } catch {
      return [createDefaultPersona()];
    }
  });

  // Another tab saved starters: take its list, so this tab's next save doesn't overwrite it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PERSONAS_KEY) return;
      const next = parsePersonas(e.newValue);
      if (next) setPersonas(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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


  // Replace all starters with those from a backup
  const restorePersonas = useCallback((list: SourdoughPersona[], activeId: string) => {
    setPersonas(migratePersonas(list));
    setActivePersonaId(activeId);
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
    restorePersonas,
  };
}

type PersonasContextValue = ReturnType<typeof usePersonasState>;

const PersonasContext = createContext<PersonasContextValue | null>(null);

/** One shared list of starters, so the menu and the calculator always agree. */
export function PersonasProvider({ children }: { children: ReactNode }) {
  return createElement(PersonasContext.Provider, { value: usePersonasState() }, children);
}

export function usePersonas(): PersonasContextValue {
  const value = useContext(PersonasContext);
  if (!value) throw new Error('usePersonas must be used inside <PersonasProvider>');
  return value;
}
