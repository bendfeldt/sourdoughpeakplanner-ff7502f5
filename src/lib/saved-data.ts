import { format } from 'date-fns';
import type { SourdoughPersona } from '@/types/sourdough';
import type { FeedingHistoryEntry } from '@/hooks/use-feeding-history';

/**
 * Ask the browser to keep this site's storage, so it isn't cleared when the
 * device runs low on space. Chrome and Safari decide without asking; Firefox
 * may ask the user. Safe to call more than once.
 */
export async function keepSavedData(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

const BACKUP_APP = 'sourdough-peak-planner';
const BACKUP_VERSION = 1;

export interface Backup {
  personas: SourdoughPersona[];
  activePersonaId: string;
  history: FeedingHistoryEntry[];
}

export function createBackup(data: Backup, now: Date = new Date()): string {
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data }, null, 2);
}

export function backupFileName(now: Date = new Date()): string {
  return `sourdough-backup-${format(now, 'yyyy-MM-dd')}.json`;
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

/** The backup in a file, or null if it isn't a backup from this app. Starters must still go through the personas migration. */
export function parseBackup(text: string): Backup | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(data) || data.app !== BACKUP_APP || !Array.isArray(data.personas)) return null;

  const personas = data.personas.filter((p): p is SourdoughPersona =>
    isObject(p) && typeof p.id === 'string' && typeof p.name === 'string'
    && Array.isArray(p.flourBlend) && isObject(p.feedingRatio));
  if (personas.length === 0) return null;

  const history = (Array.isArray(data.history) ? data.history : []).filter((e): e is FeedingHistoryEntry =>
    isObject(e) && typeof e.id === 'string' && typeof e.personaId === 'string'
    && typeof e.feedingTime === 'string' && typeof e.predictedPeakTime === 'string');

  const activePersonaId = personas.some(p => p.id === data.activePersonaId)
    ? (data.activePersonaId as string)
    : personas[0].id;

  return { personas, activePersonaId, history };
}
