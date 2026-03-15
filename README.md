# Decision Support for Emergency Department Staffing (24h Probabilistic Forecast)

**Interactive Prototype Dashboard**

> Phan D., Casasola Rodriguez I.G., Ahmed Y.S.G. — University of Waterloo, March 2026

This prototype is the working implementation of the 45-page research proposal _"Decision Support for Emergency Department Staffing (24h probabilistic forecast)"_. It demonstrates, end-to-end, how a hospital could consume probabilistic demand forecasts to make better short-horizon staffing decisions — without replacing clinical judgment.

**This is a prototype built for professor review.** The ML model and hospital data are replaced with realistic synthetic generators. The forecasting methodology, staffing logic, decision workflow, and audit/provenance system are faithful to the proposal.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [The Proposed Solution](#the-proposed-solution)
3. [System Architecture](#system-architecture)
4. [How the Forecasting Works](#how-the-forecasting-works)
5. [How Staffing Proposals Are Generated](#how-staffing-proposals-are-generated)
6. [The Chief Nurse Decision Workflow](#the-chief-nurse-decision-workflow)
7. [Scenario Conditioning](#scenario-conditioning)
8. [Decision Governance and Audit Trail](#decision-governance-and-audit-trail)
9. [How the Prototype Maps to the Proposal](#how-the-prototype-maps-to-the-proposal)
10. [Research Questions Addressed](#research-questions-addressed)
11. [What Would Change in Production](#what-would-change-in-production)
12. [Running the Prototype](#running-the-prototype)
13. [Walkthrough Script](#walkthrough-script)

---

## The Problem

Emergency department crowding is a persistent systems problem in Canadian hospitals. It drives long patient wait times, high LWBS (Left Without Being Seen) rates, throughput deterioration, and downstream impacts on inpatient flow. At its core, crowding is a mismatch between demand and available staffing resources.

Today, ED staffing decisions are made by charge nurses and scheduling offices using manual judgment. They look at historical patterns, gut feel, and whatever information is immediately available. This works — but it has known failure modes:

- **Understaffing** leads to congestion, longer LOS, higher LWBS, and worse patient outcomes
- **Overstaffing** wastes scarce labor dollars and reduces flexibility for later surges
- **Reactive adjustments** (calling in staff after a surge starts) are slow and expensive
- **No uncertainty quantification** — decisions are based on single point estimates, not risk-aware ranges

The proposal argues that ED leaders already have the data to do better. Hospitals collect arrival timestamps, triage acuity scores, occupancy counts, and disposition records through their EHR/EDIS systems and HL7 v2 ADT message feeds. This data can power probabilistic forecasts that quantify _ranges_ of plausible demand — not just a single number — enabling risk-aware staffing decisions.

---

## The Proposed Solution

The system is a **decision-support workflow**, not an autonomous staffing controller. It sits between the hospital's data systems and its existing workforce scheduling platform, providing forecasts and recommendations that the chief nurse reviews, edits, and approves.

The end-to-end flow described in the proposal:

```
Hospital Systems          Forecast & AI Engine         Decision Dashboard          Workforce Scheduling
─────────────────         ──────────────────          ──────────────────          ────────────────────

HL7 v2 ADT Feed  ──────► ADT Data Processing
(Arrivals,                     │
 Discharges,              Forecast Models ──────────► Demand Forecasts
 Transfers)               (P10 / P50 / P90)           (Normal/Elevated/Critical)
                                │                            │
ED Patient Records        AI Scheduling Agent ─────► Staffing Recommendations ──► API Integration
                          (Shift Optimization)             │                      or File Export
Hospital Scheduling            │                     Chief Nurse Review            │
Data ─────────────────► Scenario Generator            Accept / Edit / Reject      Staffing Platform
                               │                           │                     (UKG / Kronos / etc.)
                          Audit Log ◄──────────────── Decision Provenance
```

The key innovation is not the forecast model itself — probabilistic ED forecasting is well-established in the literature. The innovation is the **complete socio-technical workflow**: uncertainty-aware forecasts presented as actionable status levels, converted into multi-role staffing proposals by an AI Scheduling Agent, reviewed through a structured accept/decline/edit/re-suggest loop by the chief nurse, with full audit provenance linking every decision back to the forecast context, scenario toggles, and constraints that produced it.

---

## System Architecture

The proposal defines four major subsystems (see Figure 1 in the proposal):

### 1. Hospital Systems Layer (Data Ingestion)

In production, operational signals are derived from hospital clinical event feeds:

- **HL7 v2 ADT messages**: ADT^A01 (admit), ADT^A04 (register), ADT^A02 (transfer), ADT^A03 (discharge), ADT^A08 (update). These reconstruct encounter timelines and location movement.
- **FHIR resources**: Encounter, Location, and operational Observation resources for census and throughput indicators. Supports SMART-on-FHIR embedding inside EHR workflows.
- **Derived signals**: Hourly non-severe arrival counts (ANS_h), high-acuity arrival counts (AAC_h), departure counts (D_h), and ED occupancy (O_h).

**In this prototype**: Synthetic temporal pattern generators replace the hospital data feed. The generators produce realistic diurnal curves matching published ED arrival patterns.

### 2. Forecast & AI Engine

The forecast engine produces three 24-hour time series, each with P10/P50/P90 uncertainty bands:

- **Non-severe arrivals** (patients/hour)
- **High-acuity arrivals** (patients/hour)
- **ED occupancy** (patients present)

The AI Scheduling Agent then converts these forecasts into concrete staffing numbers for each 4-hour block and each ED role.

**In this prototype**: The forecast engine uses parametric temporal patterns with Gaussian noise and scenario modifiers. The staffing agent uses a load-based capacity model. In production, these would be replaced by a trained diffusion-based probabilistic model and a constrained optimization solver.

### 3. Decision Support Dashboard

The interactive interface where the chief nurse consumes forecasts, reviews staffing proposals, and makes decisions. Three main views:

- **Dashboard**: Forecast visualization with scenario controls
- **Staffing**: Block-by-block staffing grid with accept/decline workflow
- **Audit**: Decision timeline with full provenance

### 4. Workforce Scheduling Integration

Approved schedules are exported to the hospital's enterprise workforce scheduling platform (e.g., UKG/Kronos) through either API integration or controlled file-based exchange (staffing plan deltas). Only approved schedules are transmitted — the system never autonomously changes staffing.

**In this prototype**: Export generates a JSON schedule artifact. In production, this would produce work-queue items, open-shift requests, and manager approval payloads compatible with the scheduling platform.

---

## How the Forecasting Works

### The Three Forecast Targets

The proposal defines three operational variables that ED leaders use to plan staffing:

| Variable             | Symbol | Definition                                                                         | Why It Matters                                                                                                                             |
| -------------------- | ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Non-severe arrivals  | ANS_h  | Patients/hour classified as non-severe by triage (e.g., CTAS/ESI low-acuity bands) | Drives nursing workload, triage volume, and throughput demand                                                                              |
| High-acuity arrivals | AAC_h  | Patients/hour classified as high-acuity by triage                                  | Drives physician, surgical, respiratory therapy, and critical care demand — each high-acuity patient consumes significantly more resources |
| ED occupancy         | O_h    | Total patients physically present in ED locations during hour h                    | Drives nursing ratios, bed management, porter demand, and crowding pressure                                                                |

### Uncertainty Bands: P10 / P50 / P90

Rather than producing a single forecast number, the system produces three quantiles for each hour and each variable:

- **P10 (10th percentile)**: The optimistic scenario. 90% of the time, actual demand will be _at least_ this high. Mapped to **Normal** status.
- **P50 (50th percentile)**: The median expectation. Mapped to **Elevated** status.
- **P90 (90th percentile)**: The conservative scenario. Only 10% of the time will actual demand exceed this. Mapped to **Critical** status.

This three-level mapping is a core design decision from the proposal. Rather than showing raw percentiles (which are hard to act on under time pressure), the dashboard presents uncertainty as operational status levels:

```
status(q) = { Normal,      q = 0.10  (P10)
             { Elevated,    q = 0.50  (P50)
             { Critical,    q = 0.90  (P90)
```

The chief nurse selects a risk posture (Normal, Elevated, or Critical), and the staffing recommendations are computed using the corresponding quantile. A nurse who selects "Critical" is planning for the 90th percentile scenario — more conservative, more staff, but better protected against surges.

### The Occupancy Identity

ED occupancy is not forecast independently — it is computed from the cumulative flow identity described in the proposal:

```
O_h = O_{h-1} + A_h - D_h
```

Where A_h = ANS_h + AAC_h (total arrivals) and D_h is departures. This identity ensures internal consistency between arrival forecasts and occupancy projections.

### Temporal Patterns (Prototype)

In the prototype, base arrival patterns follow well-documented diurnal curves from ED operations literature:

**Non-severe arrivals**: Trough at 03:00-05:00 (~2-3 patients/hr), morning ramp through 06:00-11:00, peak at 10:00-14:00 (~10-12 patients/hr), secondary evening bump at 18:00-20:00 (~8-9 patients/hr), then evening decline.

**High-acuity arrivals**: Flatter curve, baseline ~1.0-1.5 patients/hr, modest peak mid-day ~2.5 patients/hr. High-acuity patients arrive more uniformly across the day.

**Departures**: Follow arrivals with approximately 3-4 hour lag (reflecting average ED length of stay).

**Occupancy**: Starts at ~35 patients (overnight baseline), builds through the day as arrivals outpace departures, peaks at ~55-65 patients during 14:00-18:00, then gradually decreases as evening departures catch up.

P10/P50/P90 bands are generated around these base patterns: P10 = base x 0.75, P50 = base, P90 = base x 1.35, with ~8% Gaussian noise for realism.

### Production Forecasting Method

The proposal specifies a **diffusion-based probabilistic time-series model** for production use:

- A conditional denoising diffusion probabilistic model (DDPM) generates multiple scenario trajectories for all three targets simultaneously
- Binary operational toggles (Influenza Outbreak, Major Incident) serve as conditioning inputs via classifier-free guidance
- Empirical quantiles (P10, P50, P90) are extracted from the generated scenario distribution
- Forecast quality is evaluated using distributional metrics (pinball loss, CRPS) and calibration diagnostics

---

## How Staffing Proposals Are Generated

### The Load Formula

The AI Scheduling Agent converts forecasts into staffing numbers using a load-based model. The effective load per hour is defined as:

```
L_h = ANS_h + alpha * AAC_h + beta * O_h
```

Where alpha >= 1 reflects the higher resource intensity of high-acuity patients, and beta >= 0 reflects backlog pressure from occupancy. In this prototype: alpha = 2.0, beta = 0.3 (i.e., each high-acuity patient generates 2x the workload of a non-severe arrival, and occupancy contributes 0.3x per patient as background load).

### Block Aggregation

The 24-hour day is divided into six 4-hour shift blocks:

| Block | Hours         | Label         |
| ----- | ------------- | ------------- |
| B1    | 00:00 - 04:00 | Overnight     |
| B2    | 04:00 - 08:00 | Early morning |
| B3    | 08:00 - 12:00 | Morning       |
| B4    | 12:00 - 16:00 | Afternoon     |
| B5    | 16:00 - 20:00 | Evening       |
| B6    | 20:00 - 00:00 | Night         |

The block load is the **maximum** hourly load within that block — staffing must cover the peak hour:

```
L_b = max(L_h : h in block b)
```

### Role-Specific Headcount Calculation

For each of the 9 ED roles, headcount is derived from block load using a role-specific service-rate parameter (patients/hour/staff member) and demand sensitivity weights:

```
s_{r,b} >= ceil( g_r(L_b) / mu_r )
```

Where g_r maps block load to role-specific demand (e.g., surgical demand is driven heavily by acuity, porter demand by occupancy), and mu_r is the service rate.

The 9 roles covered, matching the proposal's full ED team:

| Role                  | Service Rate | Primary Demand Driver               |
| --------------------- | ------------ | ----------------------------------- |
| Attending Physician   | 2.5 pts/hr   | Balanced acuity + volume            |
| Emergency Nurse       | 4.0 pts/hr   | Volume + occupancy (primary scaler) |
| Triage Nurse          | 6.0 pts/hr   | Arrival volume                      |
| Resident              | 3.0 pts/hr   | Balanced acuity + volume            |
| Trauma Surgeon        | 1.5 pts/hr   | High-acuity driven                  |
| Radiologist           | 5.0 pts/hr   | Moderate acuity sensitivity         |
| Respiratory Therapist | 4.0 pts/hr   | High-acuity driven                  |
| Social Worker         | 3.0 pts/hr   | Occupancy driven                    |
| Security Officer      | 8.0 pts/hr   | Volume + occupancy                  |

Every role has a configured **minimum staffing floor** — the absolute minimum for any block regardless of forecasted demand. This implements the hard feasibility constraint from the proposal: sMin*{r,b} <= s*{r,b} <= sMax\_{r,b}.

### Risk Posture Effect on Staffing

The risk posture selected by the chief nurse determines which quantile drives the staffing calculation:

- **Normal** (P10): Staff for the optimistic scenario. Lean coverage, lower cost, accepts risk of being understaffed if demand is higher than expected.
- **Elevated** (P50): Staff for the median scenario. Balanced coverage.
- **Critical** (P90): Staff for the conservative scenario. Maximum coverage, higher cost, minimal risk of being understaffed.

Switching from Normal to Critical can increase total headcount by 30-50% depending on the scenario — this is the operational value of uncertainty-aware staffing.

---

## The Chief Nurse Decision Workflow

The proposal defines the chief nurse as the **decision authority**. The system is explicitly not autonomous — it recommends, the chief nurse decides. The workflow (Figure 2 in the proposal):

### Step 1: Set Scenario Context

The chief nurse sets two binary operational toggles and a risk posture:

- **Influenza Outbreak** (on/off): Declared by public health or hospital infection control
- **Major Incident** (on/off): Declared by hospital command (MCI protocol)
- **Risk Status** (Normal / Elevated / Critical): The nurse's chosen planning posture

These are **conditioning inputs**, not model parameters. They represent externally declared operational conditions, which preserves accountability — the system doesn't infer whether an outbreak is happening; it responds to the nurse's declared state.

### Step 2: Review Forecast Bands

The dashboard shows three forecast charts with P10/P50/P90 confidence bands. The nurse can see:

- How demand is expected to evolve over the next 24 hours
- How wide the uncertainty is (narrow bands = high confidence, wide bands = prepare for variability)
- How toggling scenarios changes the forecast shape (e.g., influenza raises the entire non-severe curve by ~40%)

### Step 3: Review Staffing Proposals

The AI Scheduling Agent produces a staffing proposal: a grid of 6 blocks x 9 roles with recommended headcounts. The nurse reviews each block and decides:

### Step 4: Per-Block Decision

For each of the 6 blocks, the chief nurse chooses one of four actions:

**Accept** — The proposed staffing is approved as-is. The block turns green and is marked for export to the workforce scheduling system.

**Decline + Manual Entry** — The nurse disagrees with the proposal and enters their own staffing numbers. The system logs the override with the nurse's rationale. The manually entered schedule is used instead.

**Decline + Re-suggest with Constraints** — The nurse wants a revised proposal but doesn't want to specify every number. They provide structured constraints (e.g., "minimum 10 emergency nurses", "maximum 2 trauma surgeons", "exactly 3 residents"). The AI Agent re-optimizes within those constraints and returns a revised proposal for comparison.

**Reset** — Undo a previous decision and return the block to pending status.

### Step 5: Re-suggest Loop

When the nurse requests a re-suggestion:

1. The nurse enters one or more constraints (role + type [min/max/exact] + value)
2. The system shows an "AI Agent thinking..." animation (simulating optimization)
3. A revised proposal is returned alongside the original for side-by-side comparison
4. The nurse sees which constraints were satisfied and the net staffing change
5. The nurse can accept the revision, keep the original, or re-suggest again with different constraints

This loop implements the **iterative human-AI refinement** described in the proposal — the system gets the nurse to an acceptable schedule faster than manual planning, while preserving full control.

### Step 6: Export

Once all 6 blocks have been decided, the complete schedule can be exported. In production, this would generate workforce scheduling artifacts (open-shift requests, work-queue items, schedule deltas) with provenance IDs linking back to the forecast and decision context.

---

## Scenario Conditioning

The two operational toggles are designed for governance-compatible stress-ready planning:

### Influenza Outbreak

When activated, models the operational impact of a declared influenza surge:

- Non-severe arrivals increase ~40% (respiratory/fever presentations)
- High-acuity arrivals increase ~15% (complications, pneumonia)
- Departures decrease ~15% (longer treatment times, isolation requirements)
- Net effect: Occupancy builds faster and peaks higher, requiring more staff across all blocks

### Major Incident

When activated, models a Mass Casualty Incident (MCI) declaration:

- High-acuity arrivals spike **2.5x in hours 0-4** (trauma surge), then taper: 1.8x hours 4-8, 1.3x hours 8-12, 1.1x after
- Non-severe arrivals increase ~10% (minor injuries, worried-well)
- Departures decrease ~25% (complex trauma cases have longer stays)
- Net effect: Dramatic acuity-driven demand spike in the first shift blocks, requiring surge surgical, respiratory, and nursing coverage

### Dual-Stress (Both Active)

The compound scenario where both toggles are active. This is the worst-case planning scenario — high-volume, high-acuity, low-throughput. The proposal requires testing under all four conditions: baseline (0,0), incident only (1,0), influenza only (0,1), and dual stress (1,1).

These toggles are deliberately **binary and externally declared** rather than inferred by the model. The proposal argues this preserves accountability: the chief nurse makes an operational call about current conditions, and the system responds to that declaration. This is logged in the provenance record.

---

## Decision Governance and Audit Trail

The proposal treats governance artifacts as first-class deliverables. Every staffing decision must be traceable to:

1. **Forecast context** — What were the P10/P50/P90 values when the decision was made?
2. **Toggle state** — Were Influenza Outbreak and/or Major Incident active?
3. **Risk posture** — What status level (Normal/Elevated/Critical) was selected?
4. **AI Agent proposal** — What did the system recommend?
5. **Constraints applied** — If re-suggested, what constraints did the nurse provide?
6. **Final decision** — Accept, manual override, or revised acceptance?
7. **Decision maker** — Who approved the schedule?

The audit log stores each decision as an immutable entry with:

- Timestamp
- Event type (proposal generated, block accepted, block declined, manual override, re-suggest requested, re-suggest accepted, schedule exported)
- Block reference
- Summary text
- Full provenance detail (all 7 elements above)

This audit trail supports:

- **Post-incident review**: "Why was surgical coverage low during the MCI?" — trace back to the decision, the forecast context, the constraints that were applied
- **Governance compliance**: Demonstrate that human approval was obtained for every schedule change
- **Quality improvement**: Analyze accept vs. decline rates, revision frequency, constraint patterns, and time-to-decision metrics
- **Regulatory readiness**: Align with PHIPA requirements for accountable data-driven decisions

---

## How the Prototype Maps to the Proposal

| Proposal Section                            | What It Describes                                                                                       | Prototype Implementation                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Section 1.1 — Executive Summary             | Three forecast targets, P10/P50/P90 bands, status-coded uncertainty                                     | Dashboard page: three forecast charts with confidence bands, risk selector mapping P10/P50/P90 to Normal/Elevated/Critical |
| Section 2.1 — Background                    | Input/throughput/output framing, staffing as controllable lever                                         | Occupancy identity (O*h = O*{h-1} + A_h - D_h) implemented in forecast generator                                           |
| Section 2.4 — Research Questions            | RQ1-RQ6 on usability, scenario utility, agent feasibility, governance                                   | Each RQ addressable through prototype interaction (see below)                                                              |
| Section 2.5 — Methodology, AI Agent Loop    | 5-step workflow: derive signals → display forecast → propose staffing → chief nurse decides → audit log | Complete end-to-end flow across Dashboard → Staffing → Audit pages                                                         |
| Section 2.5 — Decision Contract (Table 1)   | Hourly forecast outputs + 4-hour staffing outputs + human decision fields                               | Types system (ForecastResponse, StaffingProposal, BlockDecisionState, AuditEntry)                                          |
| Section 2.5 — Scenario Controls (Table A3)  | Influenza Outbreak toggle, Major Incident toggle, Risk Status selector                                  | ScenarioToggles component + RiskSelector component, stored in Zustand                                                      |
| Section 2.6 — Health Data Standards         | HL7 v2 ADT mapping, FHIR resources, workforce scheduling integration                                    | Synthetic generators simulate the canonical data model; export produces scheduling-compatible JSON                         |
| Section 2.6 — Status-Coded Uncertainty      | Normal/Elevated/Critical mapped to P10/P50/P90                                                          | RiskSelector + status bar showing current posture with color coding                                                        |
| Section 3.1 — Regulatory Requirements       | PHIPA alignment, clinical governance, audit/provenance                                                  | Audit store with immutable entries, provenance detail on every decision                                                    |
| Section 3.2 — Security Controls             | RBAC, audit logs, immutable event records                                                               | Audit timeline with decision provenance (simplified for prototype)                                                         |
| Appendix 4.4.2 — Occupancy Identity         | O*h = O*{h-1} + A_h - D_h                                                                               | computeOccupancy() in forecast-generator.ts                                                                                |
| Appendix 4.4.6 — Staffing Translation       | L_h = ANS_h + alpha*AAC_h + beta*O_h, block aggregation, service-rate mapping                           | staffing-generator.ts: load formula, block max, per-role headcount with service rates                                      |
| Appendix 4.4.7 — Feasibility Constraints    | sMin*{r,b} <= s*{r,b} <= sMax\_{r,b}, constraint satisfaction                                           | re-suggest-generator.ts: applies min/max/exact constraints, reports satisfaction                                           |
| Figure 1 — System Architecture              | End-to-end ecosystem diagram                                                                            | Layout shell: sidebar nav mirrors the four subsystems                                                                      |
| Figure 2 — Chief Nurse Interaction Flow     | Toggles → forecast → staffing → accept/decline → manual/re-suggest                                      | Staffing page: full decision flow with decline modal, constraint form, re-suggest panel                                    |
| Figure 3 — Workforce Scheduling Integration | Coverage gaps → open shifts → approvals → export                                                        | Export button (appears when all blocks decided) generates scheduling artifact                                              |

---

## Research Questions Addressed

The prototype enables demonstration of all six research questions from the proposal:

**RQ1 (Forecast Consumption and Usability)**: The dashboard shows whether Normal/Elevated/Critical status labels are interpretable and useful for shift planning. Toggle between risk postures and observe how the same forecast data is reframed for different planning stances.

**RQ2 (Conditioning Utility in Operations)**: Toggle Influenza Outbreak and/or Major Incident and observe how forecast curves shift and staffing proposals adapt. Demonstrate that scenario changes are operationally plausible (not excessively conservative or under-prepared).

**RQ3 (AI Agent Scheduling Loop)**: The staffing grid demonstrates feasible 4-hour block proposals across all 9 roles. The re-suggest loop shows iterative refinement with constraints. Test whether minimum floors are respected and whether constraint-driven revisions converge quickly.

**RQ4 (Decision Governance and Accountability)**: The audit log shows complete provenance for every decision. Verify that 100% of schedule outcomes link back to forecast context, toggle states, and constraints.

**RQ5 (System Integration Feasibility)**: The data model and export format demonstrate how the system would integrate with hospital EHR (inbound: ADT/FHIR signals) and workforce scheduling platforms (outbound: schedule deltas).

**RQ6 (Operational Impact Evaluation)**: The prototype defines the measurement framework — the staffing grid shows headcount changes, the audit log tracks accept/decline ratios, and the forecast bands show where staffing-demand mismatches would occur.

---

## What Would Change in Production

| Prototype                             | Production                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Synthetic temporal pattern generators | Trained diffusion-based probabilistic model on 2+ years of historical HL7 v2 ADT / FHIR encounter data         |
| Parametric P10/P50/P90 multipliers    | Empirical quantiles from generated scenario distribution (S > 100 samples)                                     |
| Fixed scenario modifiers (x1.4, x2.5) | Learned conditional generation via classifier-free guidance on binary toggle embeddings                        |
| Load-based service-rate model         | Constrained optimization solver (queueing-theoretic or stochastic programming) with site-calibrated parameters |
| LocalStorage audit log                | Immutable event store with write-ahead logging, schema validation, and retention policies                      |
| JSON export button                    | API integration with UKG/Kronos workforce scheduling platform (open-shift requests, manager work-queue items)  |
| Single-user prototype                 | SMART-on-FHIR embedded application with RBAC (chief nurse, charge nurse, staffing office, analyst, admin)      |
| No authentication                     | SSO via hospital identity systems, role-based views                                                            |
| Client-side state (Zustand)           | Server-side state with database persistence, real-time sync                                                    |

---

## Running the Prototype

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
cd ed-staffing-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the Dashboard.

---

## Walkthrough Script

Use this script to demonstrate the prototype in a 10-15 minute review:

### 1. Dashboard (Forecast View)

1. Start at `/dashboard`. Note the three forecast charts showing P10/P50/P90 bands for the baseline scenario.
2. Observe the four metric cards: current occupancy (with gauge), arrivals last hour, wait time, available beds.
3. **Toggle Influenza Outbreak ON**. Watch the non-severe arrivals curve rise ~40%, occupancy climb higher. Point out the confidence bands widening.
4. **Toggle Major Incident ON**. Watch the high-acuity chart spike dramatically in the first 4 hours, then taper. This is dual-stress mode.
5. **Switch risk posture from Normal to Critical**. Note the status bar changes color. Explain: "Now staffing will be planned for the P90 worst-case scenario."
6. Turn both toggles OFF, set risk to Normal for the staffing demo.

### 2. Staffing Proposals

1. Navigate to `/staffing`. The 6-block x 9-role grid shows recommended headcounts.
2. Note the block timeline bar at the top — all blocks start as pending (gray).
3. **Accept blocks B1-B4** by clicking Accept. Watch them turn green on the timeline.
4. **Decline block B5**. The modal opens. Enter a reason: "Weekend evening, need more nursing coverage."
5. Choose **"Re-suggest with Constraints"**. Add constraint: Emergency Nurse, minimum, 10.
6. Watch the "AI Agent thinking..." animation. Review the side-by-side comparison showing nurses increased from the original proposal to 10.
7. **Accept the revised proposal**.
8. **Decline block B6**. Choose **"Enter Staffing Manually"**. Adjust a few numbers, submit.
9. All blocks are now decided. The **Export Schedule** button appears.

### 3. Audit Log

1. Navigate to `/audit`. The timeline shows every decision made.
2. Expand any entry to see full provenance: risk posture, toggle states, original and revised staffing, constraints applied.
3. Point out: "Every decision is traceable. If there's a post-incident review, we can reconstruct exactly what the system recommended, what the nurse changed, and why."

### 4. Scenario Stress Test

1. Go back to Dashboard. Toggle **both** scenarios ON, set risk to **Critical**.
2. Navigate to Staffing. Observe dramatically higher headcounts across all blocks.
3. Accept a few blocks, noting the system adapts recommendations to the scenario.
4. Check the Audit log — the new decisions are logged with the dual-stress scenario context.
