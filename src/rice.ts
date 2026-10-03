export type RiceInput = { id: string; reach: string | number; impact: string | number; confidence: string | number; effort: string | number }
export type ScoredFeature<T extends RiceInput> = T & { score: number | null; originalIndex: number }

function toFiniteNumber(value: string | number): number | null {
  if (typeof value === 'string' && value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function confidenceToDecimal(confidence: string | number): number | null {
  const value = toFiniteNumber(confidence)
  return value === null || value < 0 || value > 100 ? null : value / 100
}

export function calculateRiceScore(feature: RiceInput): number | null {
  const reach = toFiniteNumber(feature.reach)
  const impact = toFiniteNumber(feature.impact)
  const confidence = confidenceToDecimal(feature.confidence)
  const effort = toFiniteNumber(feature.effort)
  if (reach === null || reach < 0 || impact === null || impact < 0 || confidence === null || effort === null || effort <= 0) return null
  return (reach * impact * confidence) / effort
}

export function rankFeatures<T extends RiceInput>(features: T[]): ScoredFeature<T>[] {
  return features.map((feature, originalIndex) => ({ ...feature, score: calculateRiceScore(feature), originalIndex })).sort((left, right) => {
    if (left.score === null && right.score !== null) return 1
    if (left.score !== null && right.score === null) return -1
    if (left.score !== null && right.score !== null && left.score !== right.score) return right.score - left.score
    const leftEffort = toFiniteNumber(left.effort)
    const rightEffort = toFiniteNumber(right.effort)
    if (leftEffort !== null && rightEffort !== null && leftEffort !== rightEffort) return leftEffort - rightEffort
    const leftConfidence = confidenceToDecimal(left.confidence)
    const rightConfidence = confidenceToDecimal(right.confidence)
    if (leftConfidence !== null && rightConfidence !== null && leftConfidence !== rightConfidence) return rightConfidence - leftConfidence
    return left.originalIndex - right.originalIndex
  })
}
