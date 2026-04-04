# Demo Script — ED Staffing Decision Support

**CS 792 — University of Waterloo, Winter 2026**\
**Duration:** 5 minutes (post-presentation demo)

---

## Settings — Hospital Configuration (~1 min)

**[Open the app. Click "Settings" in the sidebar.]**

So as we discussed in the presentation, before the system can generate any forecasts or staffing proposals, it needs to know the physical constraints of the hospital. In production, this would be pulled from the hospital's asset management system and HR records — but here the charge nurse configures it.

**[Point to Hospital Resources]**

We have **2 operating rooms** and **58 beds**. These are hard constraints. If both ORs are occupied — one handling a CTAS-1 cardiac arrest, the other a CTAS-2 open fracture — and a third surgical patient arrives, they wait. The system tracks this.

**[Point to Diagnostic Equipment]**

Each piece of diagnostic equipment has a count and routing rules. We have **1 X-Ray machine, 1 CT scanner, 2 ultrasounds, and 3 lab stations**. The key is the routing — a CTAS-3 patient with stomach pain gets routed to X-ray and lab. If the X-ray is occupied by a CTAS-1 trauma patient, they wait. The dashboard monitors these bottlenecks in real time.

**[Point to CTAS Reference Table]**

This is the CTAS configuration — the Canadian Triage and Acuity Scale. Every patient gets a CTAS score at triage, and that single number drives everything: which staff they need, which equipment they're routed to, whether they need an OR, and how long they'll stay. A CTAS-1 cardiac arrest has a staff multiplier of 4x and stays 8 hours. A CTAS-5 sore throat is 0.5x and stays 90 minutes. The system also models **acuity drift** — a CTAS-3 patient can escalate to CTAS-2 if they deteriorate, which suddenly pulls in a surgeon and possibly an OR.

**[Point to Shift Templates and the 24h timeline bar]**

Instead of fixed time blocks, we use overlapping shifts — just like a real ER. Core shifts provide 24/7 coverage, swing shifts reinforce peak hours, and the flex shift is surge capacity for unexpected acuity spikes. You can see on the timeline how Day and Morning Swing overlap from 11 AM to 3 PM — that's the peak demand window.

**[Point to Staff Pool briefly]**

Each of the 9 roles has a max pool size and is linked to specific CTAS levels. A Trauma Surgeon only activates for CTAS 1-2. A Triage Nurse serves everyone. So when we forecast a flu surge of CTAS-3/4 patients, we increase nurses but leave the surgeon count unchanged.

---

## Dashboard — Forecasts & Monitoring (~1.5 min)

**[Click "Dashboard" in the sidebar.]**

This is where the chief nurse plans. In production, the data feeding these forecasts comes from the hospital's EMR — specifically **HL7 v2 ADT messages**. Every patient registration, admission, transfer, and discharge generates a standardized message. By parsing timestamps and CTAS fields from those messages, the system reconstructs hourly arrivals by acuity level, departures, and occupancy. In a FHIR-enabled hospital, the same data comes through Encounter and Location resources. Our prototype uses synthetic generators that mimic these real patterns.

**[Point to the 6 status cards]**

Six cards give the charge nurse a snapshot: current occupancy out of 58 beds, arrivals last hour summed across all CTAS levels, average wait time derived from queuing theory, available beds, **OR status** — how many of our 2 ORs are in use — and the **equipment bottleneck**, which surfaces the most loaded diagnostic resource.

**[Point to the CTAS Arrivals Chart]**

This is a 24-hour forecast of arrivals broken down by all 5 CTAS levels — stacked and color-coded. Red is CTAS-1, orange CTAS-2, yellow CTAS-3, green CTAS-4, blue CTAS-5.

**[Hover over a mid-day data point]**

When I hover, the tooltip breaks down each level — you can see CTAS-4 and 5 peak mid-day when people visit the ER during waking hours, while CTAS-1 is flat because cardiac arrests don't follow a schedule.

**[Point to OR Utilization and Equipment Utilization charts]**

Below that, OR utilization shows how close we are to surgical capacity — the red line is 100%. And the equipment chart shows per-device utilization for X-ray, CT, lab, and ultrasound.

**[Toggle Influenza Outbreak ON]**

Now — the professor mentioned scenario conditioning. When public health declares a flu outbreak, the charge nurse toggles this. Watch the chart — CTAS-3 and 4 bands thicken. More respiratory presentations, longer stays, equipment load increases on X-ray and lab.

**[Toggle Major Incident ON]**

Now we add an MCI — a bus crash. CTAS-1 triples, CTAS-2 spikes 2.5x in the first 4 hours. Look at the OR chart pushing toward 100%. The equipment bottleneck card spikes.

**[Set Risk Posture to Surge]**

Now we're planning for the P90 worst case. This can increase staffing recommendations by 30-50%.

**[Reset: both toggles OFF, risk to Lean]**

---

## Staffing — Shift Optimizer & Decision Workflow (~2 min)

**[Click "Staffing" in the sidebar.]**

The system took those hourly CTAS forecasts and ran them through the optimizer. The pipeline: for each hour and each role, compute workload weighted by CTAS multipliers, convert to headcount using service rates, then assign staff to shifts — core first, then swing for peak gaps, then flex for surge. Staff don't leave at shift boundaries — the handoff only happens when coverage is confirmed.

**[Point to the Gantt-style shift timeline]**

You can see the overlapping shifts — blue for core, amber for swing, purple for flex. The overlaps are intentional — they cover peak demand and provide handoff time.

**[Point to the Demand vs Coverage chart]**

This is the key chart. The amber area is how many staff we **need** each hour. The teal line is how many the shifts **provide**. Any gaps show in red — those are understaffed hours.

**[Point to the Staffing Grid]**

The grid shows headcount per role per shift. Notice Night Shift has lower numbers but still maintains minimums — you always need at least 1 Trauma Surgeon because a CTAS-1 can arrive anytime.

**[Hover over a cell]**

Hovering shows the rationale — why this headcount was recommended based on peak demand during this shift's hours.

Now let me show the decision workflow.

**[Click Accept on Day Shift — it turns green]**

Accepted as-is.

**[Click Decline on Night Shift]**

Say I know there's a concert downtown tonight — I expect more overnight volume. I'll re-suggest with a constraint.

**[Select: Emergency Nurse, minimum, 8. Submit.]**

The system re-optimizes within that constraint.

**[Point to the side-by-side comparison]**

Original versus revised — Emergency Nurses went up to 8. I can see exactly what changed.

**[Accept the revised proposal]**

Every decision is logged with full provenance — the forecast context, scenario state, constraints applied, who approved it.

**[Click "Audit" in the sidebar briefly]**

And here's the audit trail. Every accept, decline, re-suggest, and manual override is traceable. If there's a post-incident review — "why were we short-staffed?" — the full chain is here. That's the governance piece.

---

## Quick Stress Test (~30 sec)

**[Go to Settings. Change ORs from 2 to 1. Go back to Dashboard.]**

Watch the OR utilization chart — it roughly doubles. That single constraint change ripples through the entire system. This is what makes it a decision-support tool — the charge nurse can model "what if" scenarios before committing to a staffing plan.

**[Reset ORs to 2]**

---

That's the system. Probabilistic forecasts from EMR data, converted into shift-based staffing proposals through an acuity-weighted optimizer, reviewed by a human through a structured workflow, with full audit provenance. The system doesn't replace clinical judgment — it augments it. Thank you.

---

*End of demo. Total: ~5 minutes.*
