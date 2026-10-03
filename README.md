# Decidra

Decidra is a small, browser-based workshop demo for comparing product ideas with the RICE framework.

## RICE formula

`RICE score = Reach × Impact × Confidence ÷ Effort`

- **Reach** is the non-negative number of users affected per quarter.
- **Impact** is one of 3 (Massive), 2 (High), 1 (Medium), 0.5 (Low), or 0.25 (Minimal).
- **Confidence** is converted from its selected percentage into a decimal (for example, 80% becomes 0.8).
- **Effort** is the positive number of person-months required.

When two scores match, Decidra orders the lower-effort feature first, then the higher-confidence feature, then the feature that was added first.

## Install and start

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Vite prints the local URL in the terminal, normally `http://localhost:5173/`.

To build and preview the production bundle:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Run tests

```bash
npm test
```

The tests cover RICE scores, confidence conversion, decimal and invalid effort, ranking, tie-breaking, assumption flags, and sensitivity analysis.

## Workshop demo (three minutes)

**0:00–0:30 — Set the scene.** Show the three GymBuddy sample features and point out that Reach is measured per quarter.

**0:30–1:15 — Explain the recommendation.** Compare the calculated RICE score and suggested rank for a feature. Open its edit form and show the evidence, effort, and confidence inputs.

**1:15–2:00 — Explore the explanation.** Show the confidence sensitivity sentence and the assumption checks. Explain that these are neutral prompts for review, not judgments.

**2:00–2:40 — Apply human judgment.** Set a manual priority and provide an override reason. Return to the backlog to show the calculated score and suggested rank remain visible alongside the final PM priority. Then select **Accept suggested** to clear the override.

**2:40–3:00 — Close.** Explain the deterministic tie-break rules and the limitations below.

## Reset the demo

Refresh the browser page. The demo intentionally keeps data in React state only, so it returns to the original three GymBuddy sample features after a refresh.

## Known limitations

- Data does **not** persist after refresh.
- CSV export is not implemented.
- The application does not use authentication, a database, external APIs, or AI.

## Optional future enhancements

- Browser localStorage persistence with a clear reset control.
- CSV export of the backlog and explanation data.
- A more detailed, printable decision report.
