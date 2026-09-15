# SupplyGuard Read-only MCP Tool Design

## Availability

No MCP SDK, transport, or runtime MCP server is configured in the current architecture. SupplyGuard therefore does **not** claim to expose working MCP transport today.

The implementation provides a clean adapter boundary in `src/ai/mcpTools.js`. A future MCP server can map MCP tool calls to `executeTool(name, input)` without changing the domain services or exposing MongoDB directly.

## Safety boundary

- Every tool is read-only for the MVP.
- Tools call existing application services; they never receive a Mongoose model or collection name from the caller.
- Inputs are allowlisted and validated before service calls.
- Pagination is bounded to 100 records per call.
- Shipment and vehicle identifiers are format-validated.
- Unknown tools and unknown input keys are rejected.
- Database URIs, credentials, prompts, and secrets are never part of tool output.
- Service errors are propagated as structured application errors for the future transport adapter to serialize.

## Tools

| Tool | Service source | Inputs | Output |
|---|---|---|---|
| `get_shipments` | `shipmentService.listShipments` | `page`, `limit`, `status`, `priority`, `riskLevel`, `region` | Paginated shipment records |
| `get_high_risk_shipments` | `riskAnalysisService.listRiskShipments` | `page`, `limit` | Shipments with deterministic `HIGH` or `CRITICAL` risk |
| `get_shipment_details` | `riskAnalysisService.getRiskShipment` | `shipmentId` | Shipment data, risk score, rules, reasons, action, affected IDs |
| `get_active_disruptions` | `disruptionService.listDisruptions` | `page`, `limit`, `severity`, `region` | Active disruptions and affected shipment IDs |
| `get_available_vehicles` | `fleetService.listFleetVehicles` | `page`, `limit`, `region` | Available vehicle records |
| `get_temperature_alerts` | `coldChainService.listColdChainAlerts` | `page`, `limit`, `severity` | Recorded cold-chain alert summaries |
| `get_fleet_summary` | `fleetIntelligenceService.getFleetIntelligence` | none | Computed totals, utilization, idle, overutilized, unavailable vehicles |
| `calculate_shipment_risk` | `riskAnalysisService.getRiskShipment` | `shipmentId` | Current deterministic risk calculation and evidence |

Every result is wrapped as:

```json
{
  "tool": "get_high_risk_shipments",
  "readOnly": true,
  "data": {}
}
```

## AI usage

The assistant may select a tool based on the question intent, but the tool result remains application evidence. The model must:

1. Request only the narrowest tool needed.
2. Use exact IDs and values returned by the tool.
3. Cite tool output in `sourceReferences`.
4. State when the tool returns no data.
5. Keep recommendations separate from observed facts.
6. Never convert a suggestion into an assignment or write operation.

`calculate_shipment_risk` is authoritative for risk output. The model must not recalculate its score or change its level.

## Future MCP adapter

When MCP is added, the adapter should expose `TOOL_DEFINITIONS` as MCP metadata and translate validated MCP arguments to `executeTool`. It must preserve the same read-only service boundary, structured JSON results, error codes, and output limits.
