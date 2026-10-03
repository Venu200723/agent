import { FormEvent, useMemo, useState } from 'react'
import { getAssumptionFlags, getSensitivity } from './decision'
import { calculateRiceScore, rankFeatures } from './rice'

type Impact = '3' | '2' | '1' | '0.5' | '0.25'
type Confidence = '100' | '80' | '50'

type Feature = {
  id: string
  name: string
  description: string
  reach: string
  impact: Impact
  confidence: Confidence
  effort: string
  evidence: string
  dependency: string
  manualPriority: string
  overrideReason: string
}

type FormErrors = Partial<Record<'name' | 'reach' | 'effort' | 'manualPriority' | 'overrideReason', string>>

const emptyFeature = (): Feature => ({
  id: '', name: '', description: '', reach: '', impact: '1', confidence: '80', effort: '', evidence: '', dependency: '', manualPriority: '', overrideReason: '',
})

const sampleFeatures: Feature[] = [
  { id: 'gymbuddy-planner', name: 'Beginner Workout Planner', description: 'A friendly, step-by-step plan for someone starting their fitness journey.', reach: '800', impact: '2', confidence: '80', effort: '2.5', evidence: 'Member interviews show beginners want clearer first steps.', dependency: '', manualPriority: '', overrideReason: '' },
  { id: 'gymbuddy-videos', name: 'Exercise Demonstration Videos', description: 'Short, clear videos that help members complete each movement with confidence.', reach: '450', impact: '1', confidence: '100', effort: '3', evidence: 'Support requests frequently ask how to perform exercises safely.', dependency: 'Requires approved video production capacity.', manualPriority: '', overrideReason: '' },
  { id: 'gymbuddy-reminders', name: 'Workout Reminder Notifications', description: 'Gentle reminders that encourage members to keep their routines on track.', reach: '650', impact: '0.5', confidence: '80', effort: '1.5', evidence: 'Reminder opt-in is a common request in feedback.', dependency: '', manualPriority: '', overrideReason: '' },
]

function validate(feature: Feature): FormErrors {
  const errors: FormErrors = {}
  if (!feature.name.trim()) errors.name = 'Enter a feature name.'
  if (!/^\d+$/.test(feature.reach) || Number(feature.reach) < 0) errors.reach = 'Reach must be a non-negative whole number.'
  if (!/^\d+(\.\d+)?$/.test(feature.effort) || Number(feature.effort) <= 0) errors.effort = 'Effort must be a positive number of person-months.'
  if (feature.manualPriority && (!/^\d+$/.test(feature.manualPriority) || Number(feature.manualPriority) < 1)) errors.manualPriority = 'Manual priority must be a whole number starting at 1.'
  if (feature.manualPriority && !feature.overrideReason.trim()) errors.overrideReason = 'Add a short reason for the manual priority.'
  return errors
}

const impactLabels: Record<Impact, string> = { '3': '3 — Massive', '2': '2 — High', '1': '1 — Medium', '0.5': '0.5 — Low', '0.25': '0.25 — Minimal' }
const confidenceLabels: Record<Confidence, string> = { '100': '100% — Strong evidence', '80': '80% — Some evidence', '50': '50% — Weak evidence' }

export default function App() {
  const [features, setFeatures] = useState<Feature[]>(sampleFeatures)
  const [draft, setDraft] = useState<Feature>(emptyFeature)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const isEditing = editingId !== null
  const rankedFeatures = useMemo(() => rankFeatures(features), [features])

  const updateDraft = <Key extends keyof Feature>(key: Key, value: Feature[Key]) => setDraft((current) => ({ ...current, [key]: value }))

  function submitFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate(draft)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    if (isEditing) {
      setFeatures((current) => current.map((feature) => feature.id === editingId ? draft : feature))
    } else {
      setFeatures((current) => [...current, { ...draft, id: crypto.randomUUID() }])
    }
    cancelForm()
  }

  function editFeature(feature: Feature) {
    setDraft({ ...feature })
    setEditingId(feature.id)
    setErrors({})
    document.getElementById('feature-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function deleteFeature(id: string) {
    setFeatures((current) => current.filter((feature) => feature.id !== id))
    if (editingId === id) cancelForm()
  }

  function cancelForm() {
    setDraft(emptyFeature())
    setEditingId(null)
    setErrors({})
  }

  function acceptSuggestedRank(feature: Feature) {
    setFeatures((current) => current.map((item) => item.id === feature.id ? { ...item, manualPriority: '', overrideReason: '' } : item))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Decidra home"><span className="brand-mark">D</span>Decidra</a>
        <span className="phase-label">Phase 4 · Decision support</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-content"><p className="eyebrow">Make room for better choices</p><h1>From possibilities<br /><em>to priorities.</em></h1><p className="hero-copy">Capture the context behind each idea before deciding what should come next.</p></div>
        <div className="hero-orb" aria-hidden="true"><span>✦</span></div>
      </section>

      <section className="overview" aria-label="Backlog overview">
        <div className="stat"><span className="stat-icon">⌁</span><div><strong>{features.length}</strong><span>Features in backlog</span></div></div>
        <div className="stat note"><span className="spark">✦</span><p><b>Reach is measured per quarter.</b> Add the evidence and constraints your team needs to make a thoughtful call.</p></div>
      </section>

      <section className="workspace" aria-labelledby="backlog-heading">
        <div className="section-heading"><div><p className="eyebrow">Your focus</p><h2 id="backlog-heading">Feature backlog</h2></div><a className="primary" href="#feature-form">+ Add feature</a></div>
        <div className="table-card"><div className="table-scroll"><table><caption className="sr-only">GymBuddy feature backlog, ordered by RICE score</caption><thead><tr><th scope="col">Suggested</th><th scope="col">Final PM priority</th><th scope="col">Feature</th><th scope="col">RICE score</th><th scope="col">Actions</th></tr></thead><tbody>{rankedFeatures.map((feature, index) => <tr key={feature.id}><td>#{index + 1}</td><td>{feature.manualPriority ? `#${feature.manualPriority}` : `Suggested #${index + 1}`}</td><td><b>{feature.name}</b><small>{feature.description}</small></td><td><strong className="score">{calculateRiceScore(feature)?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}</strong></td><td className="actions"><button type="button" onClick={() => editFeature(feature)}>Edit</button>{feature.manualPriority && <button type="button" onClick={() => acceptSuggestedRank(feature)}>Accept suggested</button>}<button type="button" className="delete" onClick={() => deleteFeature(feature.id)}>Delete</button></td></tr>)}</tbody></table></div><p className="table-foot">RICE score = Reach × Impact × confidence ÷ effort. Suggested ranks use lower effort, then higher confidence, then insertion order for ties.</p></div>
        <div className="explanations" aria-label="Decision explanations">{rankedFeatures.map((feature, index) => { const sensitivity = getSensitivity(features, feature.id); const flags = getAssumptionFlags(feature, features); return <article className="explanation-card" key={`${feature.id}-explanation`}><div><p className="eyebrow">{feature.name}</p><h3>Suggested #{index + 1} · Final {feature.manualPriority ? `#${feature.manualPriority}` : `#${index + 1}`}</h3>{sensitivity && <p className="sensitivity">If confidence changes from {sensitivity.fromConfidence}% to {sensitivity.toConfidence}%, the score changes from {sensitivity.fromScore?.toLocaleString() ?? '—'} to {sensitivity.toScore?.toLocaleString() ?? '—'} and the suggested rank changes from #{sensitivity.suggestedRank} to #{sensitivity.adjustedRank}.</p>}{feature.overrideReason && <p className="override-note"><b>PM override:</b> {feature.overrideReason}</p>}</div><div className="flags">{flags.length ? flags.map((flag) => <p key={flag.kind}>{flag.message}</p>) : <p>No assumption checks need attention right now.</p>}</div></article> })}</div>
      </section>

      <section className="form-card" id="feature-form" aria-labelledby="form-heading">
        <div><p className="eyebrow">{isEditing ? 'Update the details' : 'A new possibility'}</p><h2 id="form-heading">{isEditing ? 'Edit feature' : 'Add a feature'}</h2><p className="form-intro">Fields marked <span aria-hidden="true">*</span> are required. These details are kept only while this page is open.</p></div>
        <form onSubmit={submitFeature} noValidate>
          <label>Feature name <span aria-hidden="true">*</span><input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} /></label>{errors.name && <p className="field-error" id="name-error">{errors.name}</p>}
          <label>Short description<textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} rows={3} /></label>
          <div className="form-grid">
            <div><label>Reach <span aria-hidden="true">*</span><input type="text" inputMode="numeric" value={draft.reach} onChange={(event) => updateDraft('reach', event.target.value)} aria-invalid={Boolean(errors.reach)} aria-describedby="reach-help reach-error" /></label><p className="field-help" id="reach-help">Users affected per quarter.</p>{errors.reach && <p className="field-error" id="reach-error">{errors.reach}</p>}</div>
            <label>Impact<select value={draft.impact} onChange={(event) => updateDraft('impact', event.target.value as Impact)}>{Object.entries(impactLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Confidence<select value={draft.confidence} onChange={(event) => updateDraft('confidence', event.target.value as Confidence)}>{Object.entries(confidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div><label>Effort <span aria-hidden="true">*</span><input type="text" inputMode="decimal" value={draft.effort} onChange={(event) => updateDraft('effort', event.target.value)} aria-invalid={Boolean(errors.effort)} aria-describedby="effort-help effort-error" /></label><p className="field-help" id="effort-help">Total person-months.</p>{errors.effort && <p className="field-error" id="effort-error">{errors.effort}</p>}</div>
          </div>
          <label>Evidence or assumption note<textarea value={draft.evidence} onChange={(event) => updateDraft('evidence', event.target.value)} rows={3} /></label>
          <label>Dependency or strategic-override note <span className="optional">Optional</span><textarea value={draft.dependency} onChange={(event) => updateDraft('dependency', event.target.value)} rows={2} /></label>
          <div className="override-fields"><p className="field-label">Human override <span className="optional">Optional</span></p><p className="field-help">Set a final PM priority without changing the calculated score or suggested rank.</p><label>Manual priority<input type="text" inputMode="numeric" value={draft.manualPriority} onChange={(event) => updateDraft('manualPriority', event.target.value)} aria-invalid={Boolean(errors.manualPriority)} /></label>{errors.manualPriority && <p className="field-error">{errors.manualPriority}</p>}<label>Reason for override<textarea value={draft.overrideReason} onChange={(event) => updateDraft('overrideReason', event.target.value)} rows={2} aria-invalid={Boolean(errors.overrideReason)} /></label>{errors.overrideReason && <p className="field-error">{errors.overrideReason}</p>}</div>
          <div className="form-actions"><button className="primary" type="submit">{isEditing ? 'Save changes' : 'Add feature'}</button>{isEditing && <button className="secondary" type="button" onClick={cancelForm}>Cancel</button>}</div>
        </form>
      </section>
    </main>
  )
}
