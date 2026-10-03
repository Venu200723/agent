import assert from 'node:assert/strict'
import test from 'node:test'
import { getAlternativeConfidence, getAssumptionFlags, getSensitivity } from '../.test-build/decision.js'

const feature = (overrides = {}) => ({ id: 'one', reach: 100, impact: 2, confidence: 80, effort: 1, evidence: 'Interview notes', dependency: '', ...overrides })
test('flags rule-based assumptions without making a judgment', () => { const flagged = feature({ confidence: 100, evidence: '', reach: 0, effort: 0.25, dependency: 'Legal review' }); assert.deepEqual(getAssumptionFlags(flagged, [flagged]).map(({ kind }) => kind), ['evidence', 'effort', 'reach', 'dependency']) })
test('flags when every feature uses maximum impact', () => { const first = feature({ id: 'first', impact: 3 }); const second = feature({ id: 'second', impact: 3 }); assert.ok(getAssumptionFlags(first, [first, second]).some(({ kind }) => kind === 'impact')) })
test('uses a deterministic alternative confidence level', () => { assert.equal(getAlternativeConfidence(100), 80); assert.equal(getAlternativeConfidence(80), 50); assert.equal(getAlternativeConfidence(50), 100) })
test('explains score and rank sensitivity at another confidence level', () => { const result = getSensitivity([feature({ id: 'one' }), feature({ id: 'two', reach: 120, confidence: 50 })], 'one'); assert.deepEqual(result && { fromConfidence: result.fromConfidence, toConfidence: result.toConfidence, fromScore: result.fromScore, toScore: result.toScore, suggestedRank: result.suggestedRank, adjustedRank: result.adjustedRank }, { fromConfidence: 80, toConfidence: 50, fromScore: 160, toScore: 100, suggestedRank: 1, adjustedRank: 2 }) })
