import { calculateRiceScore, rankFeatures, type RiceInput } from './rice.js'

export type ExplainableFeature = RiceInput & { impact: string | number; evidence: string; dependency: string }
export type AssumptionFlag = { kind: 'evidence' | 'impact' | 'effort' | 'reach' | 'dependency'; message: string }
const confidenceLevels = [100, 80, 50]

export function getAssumptionFlags(feature: ExplainableFeature, features: ExplainableFeature[]): AssumptionFlag[] {
  const flags: AssumptionFlag[] = []
  if (Number(feature.confidence) === 100 && !feature.evidence.trim()) flags.push({ kind: 'evidence', message: 'Confidence is set to 100%, but no evidence note has been recorded yet.' })
  if (features.length > 0 && features.every((item) => Number(item.impact) === 3)) flags.push({ kind: 'impact', message: 'Every feature currently has maximum impact. Reviewing the scale may help distinguish the options.' })
  if (Number(feature.effort) > 0 && Number(feature.effort) <= 0.25) flags.push({ kind: 'effort', message: 'This effort estimate is very small and may be worth a quick review.' })
  if (Number(feature.reach) === 0) flags.push({ kind: 'reach', message: 'Reach is zero, so this feature currently has no users affected per quarter.' })
  if (feature.dependency.trim()) flags.push({ kind: 'dependency', message: 'A dependency or strategic override has been noted for this feature.' })
  return flags
}

export function getAlternativeConfidence(current: string | number): number {
  const index = confidenceLevels.indexOf(Number(current))
  return confidenceLevels[index === -1 ? 0 : (index + 1) % confidenceLevels.length]
}

export function getSensitivity<T extends ExplainableFeature>(features: T[], featureId: string) {
  const feature = features.find((item) => item.id === featureId)
  if (!feature) return null
  const alternativeConfidence = getAlternativeConfidence(feature.confidence)
  const suggestedRank = rankFeatures(features).findIndex((item) => item.id === featureId) + 1
  const adjusted = features.map((item) => item.id === featureId ? { ...item, confidence: alternativeConfidence } : item)
  const adjustedRank = rankFeatures(adjusted).findIndex((item) => item.id === featureId) + 1
  return { fromConfidence: Number(feature.confidence), toConfidence: alternativeConfidence, fromScore: calculateRiceScore(feature), toScore: calculateRiceScore({ ...feature, confidence: alternativeConfidence }), suggestedRank, adjustedRank }
}
