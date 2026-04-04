# Decision Support for Emergency Department Staffing (24h Probabilistic Forecast)

**Interactive Prototype Dashboard**

> Phan D., Casasola Rodriguez I.G., Ahmed Y.S.G. — University of Waterloo, March 2026

This prototype is the working implementation of the 45-page research proposal _"Decision Support for Emergency Department Staffing (24h probabilistic forecast)"_. It demonstrates, end-to-end, how a hospital could consume probabilistic demand forecasts to make better short-horizon staffing decisions — without replacing clinical judgment.

**This is a prototype built for professor review.** The ML model and hospital data are replaced with realistic synthetic generators. The forecasting methodology, staffing logic, decision workflow, and audit/provenance system are faithful to the proposal.

---

## Running the Prototype

### Prerequisites

- **Node.js 18+** (check with `node -v`)
- **npm** (bundled with Node.js)

### Quick Start

```bash
git clone <repo-url> ed-staffing-dashboard
cd ed-staffing-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the Dashboard.

No environment variables, API keys, or database setup required — all data is synthetic and generated client-side.

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
12. [Walkthrough Script](#walkthrough-script)

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
- **Derived signals**: Hourly arrival counts per CTAS level (1-5), departure counts (D_h), ED occupancy (O_h), and resource utilization (OR, diagnostic equipment).

**In this prototype**: Synthetic temporal pattern generators replace the hospital data feed. The generators produce realistic diurnal curves with CTAS-stratified arrivals, ambulance pre-triage events, and equipment utilization tracking.

### 2. Forecast & AI Engine

The forecast engine produces 24-hour time series with P10/P50/P90 uncertainty bands across five CTAS acuity streams:

| CTAS Level | Label          | Characteristics                                         |
| ---------- | -------------- | ------------------------------------------------------- |
| CTAS 1     | Resuscitation  | Requires OR, highest staff multiplier, escalation paths |
| CTAS 2     | Emergent       | May require OR, high diagnostic routing                 |
| CTAS 3     | Urgent         | Moderate resource needs, most common ED presentation    |
| CTAS 4     | Less Urgent    | Standard workup, lower staffing intensity               |
| CTAS 5     | Non-Urgent     | Minimal resources, fastest throughput                   |

Each CTAS level carries metadata: `requiresOR`, `diagnosticRouting`, `avgLengthOfStayHours`, `staffMultiplier`, and escalation paths. Patients can experience **acuity drift** — escalating or de-escalating during their stay. Ambulance arrivals (~20% of volume) are pre-triaged and typically arrive as CTAS 1-3.

The AI Scheduling Agent converts these forecasts into concrete staffing numbers for each shift and each ED role.

**In this prototype**: The forecast engine uses parametric temporal patterns with Gaussian noise and scenario modifiers. The staffing agent uses a shift-based greedy optimizer. In production, these would be replaced by a trained diffusion-based probabilistic model and a constrained optimization solver.

### 3. Decision Support Dashboard

The interactive interface where the chief nurse consumes forecasts, reviews staffing proposals, and makes decisions. Four main views:

- **Dashboard** (`/dashboard`): CTAS-stacked arrivals chart, ED occupancy chart, OR utilization chart (with capacity line), equipment utilization chart (multi-line per equipment type), and six status cards (occupancy, arrivals, wait time, beds, OR status, equipment bottleneck)
- **Staffing** (`/staffing`): Gantt-style shift timeline, demand vs. coverage chart (hourly demand curves with shift coverage overlays), shift-based staffing grid with accept/decline/re-suggest workflow
- **Settings** (`/settings`): Configure OR count, beds, diagnostic equipment (add/edit/remove), CTAS reference table, shift templates with 24-hour visual timeline, and staff pool per role
- **Audit** (`/audit`): Decision timeline with full provenance

### 4. Resource Constraint Tracking

The system monitors physical resource constraints that affect staffing decisions:

- **Operating Rooms** (default 2): CTAS 1-2 patients may require OR access. Utilization is tracked and displayed alongside staffing.
- **Diagnostic Equipment**: X-Ray (1), CT Scanner (1), Ultrasound (2), Lab Stations (3). Each type has utilization tracking and capacity limits.
- **Equipment Bottleneck Monitoring**: The dashboard surfaces the most constrained resource type, enabling the chief nurse to factor physical capacity into staffing decisions.

### 5. Workforce Scheduling Integration

Approved schedules are exported to the hospital's enterprise workforce scheduling platform. Only approved schedules are transmitted — the system never autonomously changes staffing.

**In this prototype**: Export generates a JSON schedule artifact. In production, this would produce work-queue items, open-shift requests, and manager approval payloads compatible with the scheduling platform (e.g., UKG/Kronos).

---

## How the Forecasting Works

### Five CTAS Acuity Streams

Unlike a simple two-stream model (non-severe vs. high-acuity), the system forecasts arrivals across all five CTAS levels independently. Each level has distinct temporal patterns, resource requirements, and staffing implications. CTAS 1-2 patients drive surgical, OR, and critical care demand. CTAS 3 patients drive the bulk of diagnostic equipment utilization. CTAS 4-5 patients drive triage and nursing volume.

### Uncertainty Bands: P10 / P50 / P90

Rather than producing a single forecast number, the system produces three quantiles for each hour:

- **P10 (10th percentile)**: Optimistic scenario. Mapped to **Normal** status.
- **P50 (50th percentile)**: Median expectation. Mapped to **Elevated** status.
- **P90 (90th percentile)**: Conservative scenario. Mapped to **Critical** status.

The chief nurse selects a risk posture (Normal, Elevated, or Critical), and the staffing recommendations are computed using the corresponding quantile.

### Acuity Drift and Ambulance Arrivals

Patients are not static — their acuity can change during their stay. A CTAS 3 patient may escalate to CTAS 2 if their condition worsens, increasing resource demand mid-visit. The system models these transitions to produce more accurate occupancy and workload projections.

Ambulance arrivals (~20% of total volume) are pre-triaged en route and arrive predominantly as CTAS 1-3. These patients bypass the triage queue and immediately consume higher-acuity resources.

### The Occupancy Identity

ED occupancy is computed from the cumulative flow identity:

```
O_h = O_{h-1} + A_h - D_h
```

Where A_h is total arrivals across all CTAS levels and D_h is departures (varying by CTAS length-of-stay). This ensures internal consistency between arrival forecasts and occupancy projections.

### Production Forecasting Method

The proposal specifies a **diffusion-based probabilistic time-series model** for production use: a conditional denoising diffusion probabilistic model (DDPM) generating multiple scenario trajectories, with binary operational toggles as conditioning inputs via classifier-free guidance.

---

## How Staffing Proposals Are Generated

### Shift-Based Model

The system uses 6 overlapping shifts organized into three categories for continuous coverage:

| Shift            | Hours       | Category | Purpose                                |
| ---------------- | ----------- | -------- | -------------------------------------- |
| Day              | 07:00-15:00 | Core     | Primary daytime coverage               |
| Evening          | 15:00-23:00 | Core     | Primary evening coverage               |
| Night            | 23:00-07:00 | Core     | Primary overnight coverage             |
| Morning Swing    | 11:00-15:00 | Swing    | Reinforces midday surge                |
| Afternoon Swing  | 15:00-19:00 | Swing    | Bridges day-evening handoff            |
| On-Call Flex     | 19:00-23:00 | Flex     | Late evening surge capacity            |

Shifts overlap intentionally — staff do not leave at fixed boundaries. They stay until coverage is confirmed during handoff periods, ensuring no gaps in patient care.

### The Staffing Optimizer Pipeline

The optimizer follows a six-step pipeline:

1. **Forecast**: Generate hourly arrival projections per CTAS level at the selected risk quantile
2. **Hourly workload per role**: Compute workload using each CTAS level's `staffMultiplier` and each role's `requiredForCTAS` mapping
3. **Hourly required concurrent staff**: Convert workload to headcount using role-specific service rates
4. **Risk posture adjustment**: Scale requirements to the selected quantile (P50, P75, or P90)
5. **Greedy shift optimizer**: Fill shifts in priority order — core shifts first, then swing, then flex — minimizing total headcount while meeting hourly coverage requirements
6. **Coverage handoff logic**: Verify that shift overlaps provide continuous coverage with no gaps, then emit the proposal

Every role has a configured **minimum staffing floor** — the absolute minimum for any shift regardless of forecasted demand. This implements the hard feasibility constraint from the proposal.

### Risk Posture Effect on Staffing

Switching from Normal to Critical can increase total headcount by 30-50% depending on the scenario — this is the operational value of uncertainty-aware staffing.

---

## The Chief Nurse Decision Workflow

The proposal defines the chief nurse as the **decision authority**. The system recommends; the chief nurse decides.

### Step 1: Set Scenario Context

The chief nurse sets binary operational toggles (Influenza Outbreak, Major Incident) and a risk posture (Normal / Elevated / Critical). These are **conditioning inputs**, not model parameters — preserving accountability.

### Step 2: Review Forecast and Resource Status

The dashboard shows CTAS-stacked arrival charts, occupancy projections, OR utilization against capacity, and per-equipment utilization curves. Six status cards provide at-a-glance metrics: occupancy, arrivals, wait time, beds, OR status, and equipment bottleneck.

### Step 3: Review Staffing Proposals

The staffing page presents a Gantt-style shift timeline and a demand vs. coverage chart showing hourly demand curves overlaid with shift coverage. The staffing grid shows recommended headcounts organized by shift (not by fixed time block).

### Step 4: Per-Shift Decision

For each of the 6 shifts, the chief nurse chooses one of four actions:

- **Accept** — Approved as-is. Marked for export.
- **Decline + Manual Entry** — Override with custom staffing numbers. Logged with rationale.
- **Decline + Re-suggest with Constraints** — Provide structured constraints (e.g., "minimum 10 emergency nurses"). The AI Agent re-optimizes within those constraints and returns a revised proposal for side-by-side comparison.
- **Reset** — Return the shift to pending status.

### Step 5: Re-suggest Loop

The iterative human-AI refinement loop: the nurse enters constraints, the system re-optimizes, the nurse compares original vs. revised proposals, and accepts or iterates further.

### Step 6: Export

Once all 6 shifts have been decided, the complete schedule can be exported. In production, this would generate workforce scheduling artifacts with provenance IDs linking back to the forecast and decision context.

---

## Scenario Conditioning

### Influenza Outbreak

When activated: non-severe arrivals increase ~40%, high-acuity arrivals increase ~15%, departures decrease ~15%. Net effect: occupancy builds faster and peaks higher, requiring more staff across all shifts.

### Major Incident

When activated: high-acuity arrivals spike **2.5x in hours 0-4** then taper (1.8x hours 4-8, 1.3x hours 8-12, 1.1x after). Non-severe arrivals increase ~10%, departures decrease ~25%. Net effect: dramatic acuity-driven demand spike requiring surge surgical, respiratory, and nursing coverage.

### Dual-Stress (Both Active)

The compound worst-case planning scenario — high-volume, high-acuity, low-throughput. The proposal requires testing under all four conditions: baseline (0,0), incident only (1,0), influenza only (0,1), and dual stress (1,1).

These toggles are deliberately **binary and externally declared** rather than inferred by the model. The proposal argues this preserves accountability.

---

## Decision Governance and Audit Trail

Every staffing decision is traceable to: forecast context, toggle state, risk posture, AI Agent proposal, constraints applied, final decision, and decision maker. The audit log stores each decision as an immutable entry with timestamp, event type, shift reference, summary text, and full provenance detail.

This supports post-incident review, governance compliance, quality improvement analysis, and regulatory readiness aligned with PHIPA requirements.

---

## How the Prototype Maps to the Proposal

| Proposal Section                            | What It Describes                                                    | Prototype Implementation                                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Section 1.1 — Executive Summary             | Forecast targets, P10/P50/P90 bands, status-coded uncertainty        | Dashboard: CTAS-stacked arrivals, occupancy, OR utilization, and equipment charts with confidence bands            |
| Section 2.1 — Background                    | Input/throughput/output framing, staffing as controllable lever      | Occupancy identity implemented in forecast generator; resource constraint tracking                                 |
| Section 2.4 — Research Questions            | RQ1-RQ6 on usability, scenario utility, agent feasibility, governance | Each RQ addressable through prototype interaction                                                                 |
| Section 2.5 — AI Agent Loop                 | 5-step workflow: signals -> forecast -> staffing -> decide -> audit   | End-to-end flow across Dashboard -> Staffing -> Audit pages                                                       |
| Section 2.5 — Decision Contract (Table 1)   | Hourly forecast outputs + staffing outputs + human decision fields   | Types system (ForecastResponse, StaffingProposal, ShiftDecisionState, AuditEntry)                                 |
| Section 2.5 — Scenario Controls (Table A3)  | Influenza/MCI toggles, Risk Status selector                         | ScenarioToggles + RiskSelector components, stored in Zustand                                                      |
| Section 2.6 — Health Data Standards         | HL7 v2 ADT, FHIR, workforce scheduling integration                  | Synthetic generators simulate canonical data model; export produces scheduling-compatible JSON                     |
| Section 2.6 — Status-Coded Uncertainty      | Normal/Elevated/Critical mapped to P10/P50/P90                       | RiskSelector + status bar with color coding                                                                       |
| Section 3.1 — Regulatory Requirements       | PHIPA alignment, clinical governance, audit/provenance               | Audit store with immutable entries, provenance detail on every decision                                           |
| Appendix 4.4.2 — Occupancy Identity         | O_h = O_{h-1} + A_h - D_h                                           | computeOccupancy() in forecast generator                                                                          |
| Appendix 4.4.6 — Staffing Translation       | Workload computation, shift optimization, service-rate mapping       | Shift-based greedy optimizer: CTAS multipliers -> hourly workload -> core/swing/flex shift filling                |
| Appendix 4.4.7 — Feasibility Constraints    | sMin/sMax constraints, constraint satisfaction                       | Re-suggest generator: applies min/max/exact constraints per shift, reports satisfaction                           |
| Figure 2 — Chief Nurse Interaction Flow     | Toggles -> forecast -> staffing -> accept/decline -> re-suggest      | Staffing page: full decision flow with decline modal, constraint form, re-suggest panel                           |
| Figure 3 — Workforce Scheduling Integration | Coverage gaps -> open shifts -> approvals -> export                  | Export button (appears when all shifts decided) generates scheduling artifact                                     |

---

## Research Questions Addressed

**RQ1 (Forecast Consumption and Usability)**: The dashboard shows whether Normal/Elevated/Critical status labels are interpretable and useful for shift planning. Toggle between risk postures and observe how CTAS-stratified forecasts are reframed for different planning stances.

**RQ2 (Conditioning Utility in Operations)**: Toggle Influenza Outbreak and/or Major Incident and observe how forecast curves shift, resource utilization changes, and staffing proposals adapt.

**RQ3 (AI Agent Scheduling Loop)**: The staffing grid demonstrates feasible shift-based proposals across all roles. The re-suggest loop shows iterative refinement with constraints. The Gantt timeline and demand vs. coverage chart visualize how shifts overlap to provide continuous coverage.

**RQ4 (Decision Governance and Accountability)**: The audit log shows complete provenance for every decision. Verify that 100% of schedule outcomes link back to forecast context, toggle states, and constraints.

**RQ5 (System Integration Feasibility)**: The data model and export format demonstrate how the system integrates with hospital EHR (inbound: ADT/FHIR signals) and workforce scheduling platforms (outbound: schedule deltas).

**RQ6 (Operational Impact Evaluation)**: The prototype defines the measurement framework — the staffing grid shows headcount changes, the audit log tracks accept/decline ratios, and the forecast bands show where staffing-demand mismatches would occur.

---

## What Would Change in Production

| Prototype                             | Production                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Synthetic temporal pattern generators | Trained diffusion-based probabilistic model on 2+ years of historical HL7 v2 ADT / FHIR encounter data         |
| Parametric P10/P50/P90 multipliers    | Empirical quantiles from generated scenario distribution (S > 100 samples)                                     |
| Fixed scenario modifiers (x1.4, x2.5) | Learned conditional generation via classifier-free guidance on binary toggle embeddings                        |
| Greedy shift optimizer                | Constrained optimization solver (queueing-theoretic or stochastic programming) with site-calibrated parameters |
| Static CTAS parameters                | Site-calibrated CTAS service times, staff multipliers, and escalation probabilities from historical data       |
| Fixed equipment counts                | Real-time equipment availability from hospital asset management systems                                        |
| LocalStorage audit log                | Immutable event store with write-ahead logging, schema validation, and retention policies                      |
| JSON export button                    | API integration with UKG/Kronos workforce scheduling platform (open-shift requests, manager work-queue items)  |
| Settings page (manual config)         | Integration with hospital configuration management (bed census, OR scheduling, equipment maintenance)          |
| Single-user prototype                 | SMART-on-FHIR embedded application with RBAC (chief nurse, charge nurse, staffing office, analyst, admin)      |
| No authentication                     | SSO via hospital identity systems, role-based views                                                            |
| Client-side state (Zustand)           | Server-side state with database persistence, real-time sync                                                    |

---

## Tech Stack

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Recharts 3, Zustand 5, Framer Motion.

---

## Walkthrough Script

Use this script to demonstrate the prototype in a 10-15 minute review:

### 1. Settings (Configuration)

1. Navigate to `/settings`. Show the configurable parameters: OR count, bed count, diagnostic equipment, CTAS reference table, shift templates with the 24-hour visual timeline, and staff pool per role.
2. Point out: "The chief nurse or staffing office can adjust resource constraints and shift structures before reviewing forecasts."

### 2. Dashboard (Forecast and Resource View)

1. Navigate to `/dashboard`. Note the six status cards: occupancy, arrivals, wait time, beds, OR status, and equipment bottleneck.
2. Observe the CTAS-stacked arrivals chart showing all five acuity levels, the ED occupancy chart, the OR utilization chart with its capacity line, and the equipment utilization chart (multi-line, per equipment type).
3. **Toggle Influenza Outbreak ON**. Watch CTAS 4-5 arrivals rise, occupancy climb higher, equipment utilization increase.
4. **Toggle Major Incident ON**. Watch CTAS 1-2 spike dramatically in the first hours. OR utilization pushes against capacity. This is dual-stress mode.
5. **Switch risk posture from Normal to Critical**. Note the status bar color change. Explain: "Now staffing will be planned for the P90 worst-case scenario."
6. Turn both toggles OFF, set risk to Normal for the staffing demo.

### 3. Staffing Proposals

1. Navigate to `/staffing`. The Gantt-style shift timeline shows all six overlapping shifts. The demand vs. coverage chart displays hourly demand curves with shift coverage overlays.
2. The staffing grid shows recommended headcounts organized by shift (Day, Evening, Night, Morning Swing, Afternoon Swing, On-Call Flex).
3. **Accept the Day, Evening, and Night shifts** (core shifts). Watch them turn green on the timeline.
4. **Accept the Morning Swing shift**.
5. **Decline the Afternoon Swing shift**. Enter a reason: "Weekend evening, need more nursing coverage." Choose **"Re-suggest with Constraints"**. Add constraint: Emergency Nurse, minimum, 10. Watch the AI Agent re-optimize and review the side-by-side comparison.
6. **Accept the revised proposal**.
7. **Decline the On-Call Flex shift**. Choose **"Enter Staffing Manually"**. Adjust a few numbers, submit.
8. All shifts are now decided. The **Export Schedule** button appears.

### 4. Audit Log

1. Navigate to `/audit`. The timeline shows every decision made.
2. Expand any entry to see full provenance: risk posture, toggle states, original and revised staffing, constraints applied, shift reference.
3. Point out: "Every decision is traceable. If there's a post-incident review, we can reconstruct exactly what the system recommended, what the nurse changed, and why."

### 5. Scenario Stress Test

1. Go back to Dashboard. Toggle **both** scenarios ON, set risk to **Critical**.
2. Navigate to Staffing. Observe dramatically higher headcounts. Note OR and equipment pressure in the dashboard context.
3. Accept a few shifts, noting the system adapts recommendations to the scenario.
4. Check the Audit log — the new decisions are logged with the dual-stress scenario context.
