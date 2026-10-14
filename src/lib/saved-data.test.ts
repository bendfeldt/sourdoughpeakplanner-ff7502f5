// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupFileName, createBackup, migratePersonas, parseBackup } from './saved-data.ts';

const starter = {
  id: 's1', name: 'Rye Rita',
  flourBlend: [{ id: 'f', flourType: 'rye', percentage: 100, proteinContent: 9 }],
  feedingRatio: { starter: 1, flour: 5, water: 5 },
};
const feed = { id: 'h1', personaId: 's1', feedingTime: '2026-10-13T08:00:00.000Z', predictedPeakTime: '2026-10-13T14:00:00.000Z' };

test('a backup reads back the same starters, selection and feeds', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = { personas: [starter, { ...starter, id: 's2' }], activePersonaId: 's2', history: [feed] } as any;
  assert.deepEqual(parseBackup(createBackup(data)), data);
});

test('files that are not a backup are refused', () => {
  assert.equal(parseBackup('not json'), null);
  assert.equal(parseBackup('{}'), null);
  assert.equal(parseBackup(JSON.stringify({ personas: [starter] })), null); // no app marker
  assert.equal(parseBackup(JSON.stringify({ app: 'sourdough-peak-planner', personas: [] })), null);
  assert.equal(parseBackup(JSON.stringify({ app: 'sourdough-peak-planner', personas: [{ id: 1 }] })), null);
});

test('broken entries are dropped, a missing selection falls back to the first starter', () => {
  const b = parseBackup(JSON.stringify({
    app: 'sourdough-peak-planner', personas: [starter, { name: 'no id' }],
    activePersonaId: 'gone', history: [feed, { id: 'h2' }, null],
  }));
  assert.equal(b?.personas.length, 1);
  assert.equal(b?.activePersonaId, 's1');
  assert.deepEqual(b?.history, [feed]);
});

test('backup file is named by the local date', () => {
  assert.equal(backupFileName(new Date(2026, 0, 2, 0, 30)), 'sourdough-backup-2026-01-02.json');
});

test('starters from older versions are brought up to date', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const old = (x: object) => ({ ...starter, ratioInputs: { starter: '1', flour: '5', water: '5' }, ...x }) as any;
  const settings = { inputMode: 'target-window', targetStartDate: '2026-01-01', targetStartTime: '08:00', targetPeakDate: '2026-01-01', targetPeakTime: '16:00', targetTotalSourdough: 200, targetTotalSourdoughInput: '200' };
  const current = old({ timeSettings: { ...settings, inputMode: 'basic' } });
  const [wasWindow, noSettings, now] = migratePersonas([old({ timeSettings: settings }), old({}), current]);

  // Target Window mode became Weights mode; everything else is kept, so the grams follow from ratio and starter amount
  assert.deepEqual(wasWindow.timeSettings, { ...settings, inputMode: 'weights' });
  assert.deepEqual(wasWindow.feedingRatio, starter.feedingRatio);
  // Saved before time settings existed: defaults, and white sugar
  assert.equal(noSettings.timeSettings.inputMode, 'basic');
  assert.equal(noSettings.sugarType, 'white-sugar');
  // Up-to-date starters are returned as they are
  assert.equal(now, current);
});
