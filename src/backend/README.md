# SupplyGuard backend

Express and Mongoose API foundation.

Run from this directory:

```powershell
npm install
npm run dev
```

The health endpoint is `GET http://127.0.0.1:8000/api/health`.

All non-health routes require `X-API-Key` or `Authorization: Bearer <API_ACCESS_KEY>`. Configure a random, environment-only `API_ACCESS_KEY` with at least 16 characters. The API binds to `127.0.0.1` by default; set `HOST` only when a protected gateway/network boundary requires another interface.

## Read-only API

All successful responses use `{ "data": ... }`; paginated collection responses also include a `pagination` object.

- `GET /api/health`
- `GET /api/shipments?page=1&limit=20&status=delayed&riskLevel=high&priority=critical&region=Indiana`
- `GET /api/shipments/:shipmentId`
- `GET /api/disruptions?page=1&limit=20&status=active&severity=high&region=Indiana`
- `GET /api/fleet?page=1&limit=20&status=available&region=Indiana&minUtilization=0&maxUtilization=80`
- `GET /api/fleet/intelligence`
- `GET /api/fleet/:vehicleId`
- `GET /api/fleet/suggestions?shipmentId=SG-0001`
- `GET /api/sensors?page=1&limit=20&isExcursion=true&shipmentId=<object-id>&vehicleId=<object-id>`
- `GET /api/cold-chain/summary`
- `GET /api/cold-chain/alerts?page=1&limit=20&severity=critical`
- `GET /api/cold-chain/shipments/:shipmentId`
- `GET /api/dashboard/summary`
- `GET /api/risk/shipments?page=1&limit=20&riskLevel=CRITICAL&priority=critical&status=at_risk&temperatureExcursion=true&delayStatus=delayed`
- `GET /api/risk/shipments/:shipmentId`
- `GET /api/risk/summary`
- `GET /api/risk/recommendations`

Collection endpoints return an empty `data` array with pagination metadata when no records match. Invalid parameters return a structured error with an appropriate HTTP status.

Risk endpoints calculate results from the deterministic risk engine at request time. They return rule codes, reason details, affected shipment IDs, and recommended actions; they do not call an AI service.

Cold-chain endpoints read synthetic `SensorLog` records and calculate latest readings, safe ranges, alert severity, affected shipment IDs, and recorded excursion duration. Run the cold-chain unit tests with `npm run test:cold-chain`.

## Runtime AI service design

The provider-neutral runtime AI contract is documented in [`docs/runtime-ai-design.md`](docs/runtime-ai-design.md). IBM Bob is a development assistant only; it is not treated as the runtime provider. Runtime AI is disabled by default; the assistant returns a grounded deterministic fallback from application records when no provider is configured. Validate the contract with `npm run test:ai-contract`.

The assistant endpoint is `POST /api/assistant/ask` with `{ "question": "Which shipments need immediate attention?" }`. It validates the question, retrieves trusted service data, builds the structured context and prompt, calls the configured provider, validates the structured response, and returns provider/configuration errors without fabricated output. Run orchestration tests with `npm run test:assistant`.

Read-only MCP tool design is documented in [`docs/mcp-tools.md`](docs/mcp-tools.md). MCP transport is not installed or enabled in this runtime; `src/ai/mcpTools.js` provides the validated service abstraction for a future adapter. Run its tests with `npm run test:mcp`.

## Deterministic shipment risk

The risk engine is implemented in `src/services/riskEngine.js`. It uses transparent cumulative rules for delay, priority, disruption severity, temperature excursions, delivery deadlines, route state, and vehicle state. Scores are capped at 100 and mapped to:

- `LOW`: 0-19
- `MEDIUM`: 20-39
- `HIGH`: 40-64
- `CRITICAL`: 65-100

Every result includes the score, risk level, reason details, triggered rule codes, recommended action, and calculation timestamp. Run its unit tests with:

```powershell
npm run test:risk
```

## Synthetic seed data

Set `MONGODB_URI` to a local or test database, then run:

```powershell
npm run seed:synthetic
```

The command is upsert-only by default and creates repeatable synthetic shipments, disruptions, vehicles, sensor logs, and recommendations. It never runs when `NODE_ENV=production`.

To reset only the deterministic seed records, use a localhost MongoDB URI and explicitly opt in:

```powershell
$env:SEED_ALLOW_DESTRUCTIVE = "true"
npm run seed:synthetic -- --reset
```

Do not use real customer data or production database credentials for seeding.
