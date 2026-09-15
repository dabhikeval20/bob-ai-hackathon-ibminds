# SupplyGuard AI: 3-minute demo runbook

This runbook is designed for the current application and its synthetic data. It does not assume
specific shipment IDs, disruption names, scores, temperatures, vehicle IDs, or AI answers. Read
values from the screen as they appear during the demo.

## Before the demo

- Start MongoDB and load the existing synthetic dataset with the repository's documented seed command.
- Start the backend and frontend.
- Configure the environment-only API access key in both applications if API protection is enabled.
- If a runtime AI provider is enabled, verify that the provider is reachable before presenting.
- Open the dashboard at the frontend URL and keep the browser at desktop width.

## Three-minute script

| Time | Section | Exact clicks and actions | What should appear | Narration / value |
|---|---|---|---|---|
| 0:00-0:15 | 1. Open the dashboard | Open the frontend URL. If another page is open, click **Overview** in the left sidebar. Wait for the loading state to finish. | The **Supply chain overview** page with the operational hero, KPI cards, risk distribution, and operational panels. | “This is the control room: one view of shipment risk, disruption exposure, fleet capacity, and cold-chain conditions.” |
| 0:15-0:30 | 2. Show shipment KPIs | Stay on **Overview**. Point to the KPI cards and read their labels and values: total shipments, critical/high risk, delayed shipments, and temperature alerts. | KPI values returned by the dashboard/risk services. Do not quote a value until it is visible. | “The KPI strip turns a large network into a short list of decisions.” |
| 0:30-0:50 | 3. Open a critical shipment | In the risk shipment table, find the first row labeled **CRITICAL**. Click its shipment ID. If there is no CRITICAL row, use the highest-severity row shown and say “highest current risk.” | The shipment risk detail page with shipment information, risk level/score, triggered rules, reasons, and recommended action. | “I am moving from a network signal to the individual shipment and the evidence behind it.” |
| 0:50-1:05 | 4. Explain why it is risky | Read the shipment ID from the detail page. Click **Ask assistant** in the sidebar, or open it in a new tab if you want to preserve the detail page. In the assistant input, ask: `Why is shipment <SHIPMENT_ID> high risk?` Replace `<SHIPMENT_ID>` with the exact visible ID. Submit. | When runtime AI is available, a structured response with answer, key facts, risk level, recommendations, limitations, and source references. | “The explanation is grounded in the deterministic risk result and the records retrieved by the application.” |
| 1:05-1:20 | 5-6. Show a disruption and affected shipments | Return to **Overview** by clicking **Overview**. Scroll to **Active disruptions**. Click or point to the first disruption card and read its visible title, severity, status, estimated delay, and affected shipment IDs. If the card has a shipment link, open it and return with the browser back button. | Active disruption cards and their affected shipment IDs as supplied by the disruption service. | “The disruption view connects an external event to the shipments it can affect.” |
| 1:20-1:40 | 7-8. Check fleet and find an available vehicle | Click **Fleet utilization**. Review the fleet summary cards and utilization chart. Scroll to the vehicle list or available-vehicle section. Select the first vehicle whose status is **available**; click its vehicle ID if the ID is a link. | Fleet totals, utilization/idle/overutilized information, and the available vehicle record/detail when selected. | “This shows whether we have practical capacity to respond, not just that a shipment is at risk.” |
| 1:40-1:55 | 9. Check temperature alerts | Click **Cold-chain alerts**. Review the alert count/list and select the first alert marked as an excursion or with the highest severity. Click its shipment ID if available. | Temperature alert records, latest reading, allowed range, severity, and the shipment temperature detail page when opened. | “For temperature-sensitive cargo, the latest sensor evidence makes the risk actionable.” |
| 1:55-2:25 | 10-11. Ask the assistant for an evidence-based recommendation | Click **Ask assistant**. Use one of these exact supported questions: `Which shipments need immediate attention?` or `What should the logistics manager do first?` Submit one question only. | A structured answer with key facts, affected shipments/vehicles, risk level, recommendations, limitations, and source references. | “The assistant is a review aid: it recommends what to investigate next, but it does not execute an operational action.” |
| 2:25-2:45 | Cross-check evidence | In the assistant response, point to one affected shipment or vehicle ID and its source reference. Use the sidebar to return to the corresponding risk, fleet, or cold-chain page and confirm the record. | The same entity and supporting record on the application page. | “Recommendations are useful because an operator can trace them back to application evidence.” |
| 2:45-3:00 | 12. Explain business value | Leave the assistant response or return to Overview. Deliver the closing statement below. | Dashboard remains available for follow-up questions. | “SupplyGuard reduces the time from signal to decision: it highlights the highest-risk shipments, links disruptions and sensor evidence, checks response capacity, and gives a traceable review recommendation. The operator stays in control.” |

## Exact supported assistant questions

Use these wording patterns because they match the current intent detector:

- `Which shipments need immediate attention?`
- `Why is shipment <SHIPMENT_ID> high risk?`
- `What disruptions are affecting shipments?`
- `Which vehicles are idle?`
- `Which vehicles can help with shipment <SHIPMENT_ID>?`
- `Are there any temperature alerts?`
- `What should the logistics manager do first?`

For the shipment-specific question, copy the ID displayed by the application. Do not type an
ID from memory or invent one.

## AI-provider-unavailable backup plan

If the assistant shows **Runtime AI provider is not configured**, **Runtime AI provider failed**,
or another provider error:

1. Do not claim that an AI answer was generated.
2. Return to **Overview** and open the first visible **CRITICAL** or highest-risk shipment.
3. Read the deterministic risk level, score, triggered rules, reason details, and recommended action
   from the shipment risk detail page.
4. Use the active disruption card and temperature-alert card to show affected shipments and evidence.
5. Open **Fleet utilization** and identify an available vehicle from the visible list.
6. Say: “The runtime provider is unavailable, so I am using SupplyGuard's deterministic risk engine
   and operational records. These findings are still evidence-based; the optional narrative assistant
   is not being represented as available.”

This fallback uses existing deterministic pages and does not fabricate an AI response or substitute
fake data.

## Presenter guardrails

- Do not promise that a shipment was reassigned, a disruption was resolved, or an action was executed.
- Do not quote counts, IDs, scores, temperatures, delays, or recommendations before they appear.
- The current **Disruptions** navigation entry is a workspace placeholder; use the **Active disruptions**
  panel on **Overview** for the live disruption portion of this demo.
- If a panel is empty, state what the screen says and move to the next section; do not invent a record.
- Keep the demo read-only. The current MCP design is read-only and the UI has no action-execution flow.

