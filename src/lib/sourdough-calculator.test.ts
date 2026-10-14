// Run with: npm test (node --test, no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFeedingSchedule,
  calculateFermentationTime,
  calculateRequiredRatio,
  calibrationFactorFor,
  formatRatio,
  ratioFromGrams,
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
  close(sugarFactor(sugarConcentration({ ...sweet, sugarPercentage: 10 }, 1)), 1.09, 0.01);
});

test('sugar up to the same weight as flour: slows more and more, stops at syrup strength', () => {
  const sweet = { isSweetMode: true, sugarType: 'white-sugar' as const };
  const factors = [10, 25, 50, 100].map(sugarPercentage => sugarFactor(sugarConcentration({ ...sweet, sugarPercentage }, 1)));
  for (let i = 1; i < factors.length; i++) assert.ok(factors[i] > factors[i - 1]);
  close(factors[3], 10, 0.01); // 1:1:1:1 starter, flour, water, sugar

  const equalParts = calculateFeedingSchedule(input({ ...sweet, sugarPercentage: 100 }));
  assert.equal(equalParts.sugarAmount, 100);
  close(equalParts.hoursToReachPeak, 35, 0.1);

  // Stiff starter with as much sugar as flour: more sugar than the water can carry for growth
  const syrup = calculateFeedingSchedule(input({ ...sweet, sugarPercentage: 100, feedingRatio: { starter: 1, flour: 1, water: 0.5 } }));
  assert.equal(syrup.exceedsMaxHours, true);
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

test('an unreachable target peak time warns instead of faking the peak time', () => {
  const target = new Date(START.getTime() + 45 * 60 * 1000);
  const result = calculateFeedingSchedule(input({ inputMode: 'total-sourdough', targetTotalSourdough: 200, targetPeakTime: target }));
  assert.equal(result.achievabilityWarning, 'targetPeakTooSoon');
  assert.ok(!result.suggestions.includes('targetPeakTooSoon'), 'shown in its own box, not as a cut-off tip');
  assert.ok(result.estimatedPeakTime > target, 'peak shows what the starter will really do');
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

test('grams typed in Weights mode give back exactly those grams', () => {
  const schedule = (starter: number, flour: number, water: number, starterPart = 1) =>
    calculateFeedingSchedule(input({ inputMode: 'weights', feedingRatio: ratioFromGrams(starter, flour, water, starterPart), oldSourdoughAmount: starter }));
  for (const [starter, flour, water] of [[37, 113, 89], [13, 71, 47], [300, 100, 100], [400, 150, 120], [7, 100, 333]]) {
    const r = schedule(starter, flour, water);
    assert.deepEqual([r.starterAmount, r.flourAmount, r.waterAmount], [starter, flour, water], `${starter}/${flour}/${water}`);
  }
  // A starter saved as 2:1:1 keeps its starter part
  assert.deepEqual(ratioFromGrams(50, 50, 25, 2), { starter: 2, flour: 2, water: 1 });
  const r = schedule(50, 50, 25, 2);
  assert.deepEqual([r.flourAmount, r.waterAmount], [50, 25]);
});

test('Weights mode predicts from the feed; 50/50/50 g peaks like 1:1:1', () => {
  const weights = calculateFeedingSchedule(input({ inputMode: 'weights', feedingRatio: ratioFromGrams(37, 113, 89), oldSourdoughAmount: 37 }));
  assert.equal(weights.recommendedRatio, null, 'Weights mode predicts from the feed, it does not aim at a time');

  // 50/50/50 g is the reference feed 1:1:1
  const even = calculateFeedingSchedule(input({ inputMode: 'weights', oldSourdoughAmount: 50 }));
  const normal = calculateFeedingSchedule(input({ inputMode: 'basic', oldSourdoughAmount: 50 }));
  assert.equal(even.estimatedPeakTime.getTime(), normal.estimatedPeakTime.getTime());
  close(even.hoursToReachPeak, 3.5, 0.01);
});

test('the summary shows the ratio per part of starter', () => {
  assert.equal(formatRatio({ starter: 1, flour: 1, water: 1 }), '1 : 1 : 1');
  assert.equal(formatRatio(ratioFromGrams(13, 71, 47)), '1 : 5.46 : 3.62');
  assert.equal(formatRatio({ starter: 2, flour: 5, water: 4.5 }), '1 : 2.5 : 2.25');
  assert.equal(formatRatio({ starter: 1, flour: 2.5, water: 1.75 }, 'da'), '1 : 2,5 : 1,75');
});
