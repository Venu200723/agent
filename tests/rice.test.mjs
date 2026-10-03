import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateRiceScore, confidenceToDecimal, rankFeatures } from '../.test-build/rice.js'

const feature = (overrides = {}) => ({ id: 'feature', reach: 100, impact: 2, confidence: 100, effort: 1, ...overrides })

test('calculates the example RICE score of 500', () => assert.equal(calculateRiceScore(feature({ effort: 0.4 })), 500))
test('converts confidence percentages into decimal values', () => { assert.equal(confidenceToDecimal(80), 0.8); assert.equal(confidenceToDecimal('50'), 0.5) })
test('supports decimal effort', () => assert.equal(calculateRiceScore(feature({ effort: 2.5 })), 80))
test('safely rejects invalid and zero effort', () => { assert.equal(calculateRiceScore(feature({ effort: 0 })), null); assert.equal(calculateRiceScore(feature({ effort: 'not a number' })), null) })
test('ranks higher scores before lower scores', () => assert.deepEqual(rankFeatures([feature({ id: 'low', reach: 10 }), feature({ id: 'high', reach: 100 })]).map(({ id }) => id), ['high', 'low']))
test('breaks score ties by effort, confidence, then original insertion order', () => {
  const tied = [feature({ id: 'later', reach: 100, effort: 2 }), feature({ id: 'lower-confidence', reach: 125, confidence: 80, effort: 2 }), feature({ id: 'low-effort', reach: 50, effort: 1 }), feature({ id: 'first', reach: 100, effort: 2 })]
  assert.deepEqual(rankFeatures(tied).map(({ id }) => id), ['low-effort', 'later', 'first', 'lower-confidence'])
})
