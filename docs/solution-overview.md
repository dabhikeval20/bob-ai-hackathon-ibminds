# Solution overview

SupplyGuard AI combines a React/Vite operations dashboard with an Express/Mongoose API,
MongoDB-backed domain services, and a deterministic shipment-risk engine. The UI presents
shipment KPIs, risk explanations, active disruptions, affected shipments, fleet utilization,
available vehicles, cold-chain alerts, and shipment detail views.

The repository also contains a provider-neutral runtime AI contract. Runtime AI is disabled by
default; the base provider returns a controlled configuration error instead of fabricating an
answer. IBM Bob is the development assistant used to build and document the project, not the
runtime inference provider. The MCP implementation is a read-only validated service boundary;
no MCP server or transport is installed.

All operational views are read-only. Vehicle suggestions are manual review guidance and do not
assign vehicles or mutate records.
