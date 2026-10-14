import { useState, useEffect, useCallback, createContext, createElement, useContext, type ReactNode } from 'react';
import type { SourdoughPersona, FlourBlendItem, FeedingRatio } from '@/types/sourdough';
import { FLOUR_DATA, generateId } from '@/lib/sourdough-calculator';
import { useI18n } from '@/lib/i18n';
import { createDefaultTimeSettings, migratePersonas } from '@/lib/saved-data';

const PERSONAS_KEY = 'sourdough-personas';
const ACTIVE_PERSONA_KEY = 'sourdough-active-persona';

export function createDefaultPersona(name: string): SourdoughPersona {
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
  const { t } = useI18n();
  const [personas, setPersonas] = useState<SourdoughPersona[]>(() => {
    if (typeof window === 'undefined') return [createDefaultPersona(t('myStarter'))];
    try {
      return parsePersonas(localStorage.getItem(PERSONAS_KEY)) ?? [createDefaultPersona(t('myStarter'))];
    } catch {
      return [createDefaultPersona(t('myStarter'))];
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
  // Counts restores, so the calculator reloads its form even when the selected starter keeps its id
  const [restoreCount, setRestoreCount] = useState(0);
  const restorePersonas = useCallback((list: SourdoughPersona[], activeId: string) => {
    setPersonas(migratePersonas(list));
    setActivePersonaId(activeId);
    setRestoreCount(n => n + 1);
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
    restoreCount,
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
