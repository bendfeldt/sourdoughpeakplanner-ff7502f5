// Run with: npm test (node --test, no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFeedingSchedule,
  calculateFermentationTime,
  calculateRequiredRatio,
  calibrationFactorFor,
  sugarConcentration,
  sugarFactor,
  temperatureFactor,
  type CalibrationEntry,
} from './sourdough-calculator.ts';
import type { CalculationInput } from '../types/sourdough.ts';

const START = new Date('2026-01-01T08:00:00');

function input(overrides: Partial<CalculationInput> = {}): CalculationInput {
  return {
    flourBlend: [{ id: 'a', flourType: 'all-purpose', percentage: 100, proteinContent: 10.5 }],
    feedingRatio: { starter: 1, flour: 1, water: 1 },
    temperature: 24,
    targetStartTime: START,
    targetPeakStart: null,
    targetPeakEnd: null,
    useTargetWindow: false,
    oldSourdoughAmount: 100,
    isSweetMode: false,
    sugarPercentage: 0,
    sugarType: 'white-sugar',
    inputMode: 'basic',
    targetTotalSourdough: 0,
    targetPeakTime: null,
    ...overrides,
  };
}

const close = (actual: number, expected: number, tolerance: number) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

test('reference feeds match the calibration points', () => {
  close(calculateFermentationTime(input()), 3.5, 0.001);
  close(calculateFermentationTime(input({ feedingRatio: { starter: 1, flour: 5, water: 5 } })), 9.2, 0.05);
  close(calculateFermentationTime(input({ feedingRatio: { starter: 1, flour: 10, water: 10 } })), 13.9, 0.05);
});

test('temperature: fastest near 30-31°C, slower again above, no peak from 38°C', () => {
  let fastest = 0;
  for (let t = 15; t <= 37; t += 0.5) if (temperatureFactor(t) < temperatureFactor(fastest || 15)) fastest = t;
  assert.ok(fastest >= 30 && fastest <= 31, `fastest at ${fastest}°C`);
  assert.ok(temperatureFactor(36) > temperatureFactor(31));
  assert.ok(temperatureFactor(10) > 6, 'cold slows more than doubling every 8°C');

  const hot = calculateFeedingSchedule(input({ temperature: 38 }));
  assert.equal(hot.exceedsMaxHours, true);
  assert.ok(hot.suggestions.includes('noPeakExpected'));
  assert.equal(calculateFeedingSchedule(input()).exceedsMaxHours, false);
});

test('a stiff starter peaks later than a liquid one', () => {
  const stiff = calculateFermentationTime(input({ feedingRatio: { starter: 1, flour: 1, water: 0.5 } }));
  const liquid = calculateFermentationTime(input({ feedingRatio: { starter: 1, flour: 1, water: 1.25 } }));
  assert.ok(stiff > 3.5 && liquid < 3.5);
});

test('sugar below the threshold does not slow the starter', () => {
  const sweet = { isSweetMode: true, sugarType: 'white-sugar' as const };
  assert.equal(sugarFactor(sugarConcentration({ ...sweet, sugarPercentage: 2 }, 1)), 1);
  close(sugarConcentration({ ...sweet, sugarPercentage: 5.263 }, 1), 0.05, 0.0001);
  close(sugarFactor(sugarConcentration({ ...sweet, sugarPercentage: 10 }, 1)), 1.2, 0.01);
});

test('the same sugar slows a stiff starter more than a liquid one', () => {
  const sweet = { isSweetMode: true, sugarPercentage: 10, sugarType: 'white-sugar' as const };
  const stiff = calculateFeedingSchedule(input({ ...sweet, feedingRatio: { starter: 1, flour: 1, water: 0.5 } }));
  const liquid = calculateFeedingSchedule(input({ ...sweet }));
  assert.ok(stiff.sugarDelayMinutes > liquid.sugarDelayMinutes);
  assert.ok(liquid.sugarDelayMinutes > 0);
});

test('honey and maple syrup bring water, which is taken off the feeding water', () => {
  const honey = calculateFeedingSchedule(input({ isSweetMode: true, sugarPercentage: 10, sugarType: 'honey' }));
  assert.equal(honey.sugarAmount, 10);
  assert.equal(honey.waterAmount, 98); // 100 g − 10 g honey × 17% water
  const plain = calculateFeedingSchedule(input({ isSweetMode: true, sugarPercentage: 10 }));
  assert.equal(plain.waterAmount, 100);
});

test('the ratio solver gives back the target time, with sugar and calibration', () => {
  for (const extra of [{}, { isSweetMode: true, sugarPercentage: 8, calibrationFactor: 1.2 }]) {
    const base = input(extra);
    const ratio = calculateRequiredRatio(base, 8);
    close(calculateFermentationTime(base, ratio), 8, 0.15);
  }
});

test('an unreachable target window warns instead of faking the peak time', () => {
  const peakStart = new Date(START.getTime() + 30 * 60 * 1000);
  const peakEnd = new Date(START.getTime() + 60 * 60 * 1000);
  const result = calculateFeedingSchedule(input({ inputMode: 'target-window', useTargetWindow: true, targetPeakStart: peakStart, targetPeakEnd: peakEnd }));
  assert.equal(result.achievabilityWarning, 'targetPeakTooSoon');
  assert.ok(result.estimatedPeakTime > peakEnd, 'peak shows what the starter will really do');
});

test('saved starters using the original flour keys still calculate', () => {
  const blend = (['spelt', 'kamut', 'einkorn', 'fuldkornsmel'] as const).map((flourType, i) => ({ id: String(i), flourType, percentage: 25, proteinContent: 12 }));
  assert.ok(Number.isFinite(calculateFermentationTime(input({ flourBlend: blend }))));
});

// Simulates logging feeds for a starter that is really `trueFactor` times slower than the model.
function simulate(feeds: { sweet: boolean; trueFactor: number }[]) {
  const history: CalibrationEntry[] = [];
  const modelHours = 4;
  for (const feed of feeds) {
    const factor = calibrationFactorFor(history, 'p', feed.sweet);
    const fed = START.getTime() + history.length * 86400000;
    history.unshift({
      personaId: 'p',
      feedingTime: new Date(fed).toISOString(),
      predictedPeakTime: new Date(fed + modelHours * factor * 3600000).toISOString(),
      actualPeakTime: new Date(fed + modelHours * feed.trueFactor * 3600000).toISOString(),
      sugarAmount: feed.sweet ? 5 : 0,
      calibrationFactor: factor,
    });
  }
  return history;
}

test('calibration settles on the true factor instead of fading away', () => {
  const history = simulate(Array.from({ length: 8 }, () => ({ sweet: false, trueFactor: 1.3 })));
  close(calibrationFactorFor(history, 'p', false), 1.3, 0.001);
});

test('feeds with sugar are calibrated separately from plain feeds', () => {
  const history = simulate(Array.from({ length: 10 }, (_, i) => i % 2
    ? { sweet: true, trueFactor: 1.5 }
    : { sweet: false, trueFactor: 1.1 }));
  close(calibrationFactorFor(history, 'p', false), 1.1, 0.001);
  close(calibrationFactorFor(history, 'p', true), 1.5, 0.001);
});
