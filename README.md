# SupplyGuard AI

> A read-only supply-chain control center for monitoring shipment risk, disruptions, fleet capacity, and cold-chain conditions using synthetic logistics data.

## Problem statement

Supply-chain teams need to identify the shipments that require attention, understand why they
are at risk, see how disruptions affect the network, and determine whether operational capacity
is available to respond. These signals are often distributed across shipment, disruption, fleet,
and sensor systems, which slows down triage and makes evidence difficult to trace.

## Solution overview

SupplyGuard AI combines a React operations dashboard with an Express/Mongoose API and a
deterministic shipment-risk engine. The dashboard brings together:

- Shipment and risk KPIs
- Deterministic risk explanations with rule evidence
- Active disruption and affected-shipment records
- Fleet utilization and available-vehicle information
- Cold-chain temperature alerts and shipment readings
- A provider-neutral assistant contract for grounded logistics questions

The included dataset is synthetic and intended for local demos, testing, and evaluation. It is
not customer or production data.

## Main features

- Overview dashboard with shipment, disruption, fleet, and temperature metrics
- Shipment risk list and shipment risk detail pages
- Rule-based risk scores from `LOW` through `CRITICAL`
- Risk reasons, triggered rules, affected IDs, and recommended review actions
- Active disruption summaries and affected shipment IDs
- Fleet utilization, idle/overutilized summaries, vehicle details, and manual-only suggestions
- Cold-chain alert summaries, latest readings, safe ranges, severity, and excursion details
- Responsive desktop, tablet, and mobile interface
- Loading, empty, retry, and API-error states
- Read-only MCP tool abstraction with bounded, allowlisted inputs
- Optional runtime AI service boundary with response grounding and source-reference validation

No UI or API operation assigns vehicles, changes risk records, resolves disruptions, or performs
other operational writes.

## Technology stack

### Frontend

- React 19
- React Router
- Vite
- Tailwind CSS

### Backend

- Node.js 20 or newer
- Express 5
- Mongoose 8
- MongoDB
- Helmet, CORS, and express-rate-limit
- Node's built-in test runner

### AI and tool boundary

- Provider-neutral runtime AI contract in `src/backend/src/ai`
- Deterministic risk engine
- Read-only MCP tool definitions and service adapter
- No MCP SDK, MCP transport, or production runtime model adapter is installed

## System architecture

```text
React/Vite frontend
        |
        | JSON over HTTP
        v
Express API
  |       |         |
  |       |         +--> Read-only MCP adapter boundary
  |       +------------> Runtime AI contract (disabled by default)
  +--------------------> Domain services
                            |
                            +--> Deterministic risk engine
                            +--> Shipment/disruption/fleet/sensor services
                                      |
                                      v
                                  MongoDB
```

The backend owns database access, validation, pagination, risk calculation, and AI-context
preparation. The frontend does not call MongoDB or a model provider directly.

## Folder structure

```text
.
├── src/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── ai/         # Trusted context, prompts, response contract, MCP abstraction
│   │   │   ├── config/      # Environment and database configuration
│   │   │   ├── controllers/ # HTTP controllers
│   │   │   ├── middleware/  # Security and error middleware
│   │   │   ├── models/      # Mongoose models
│   │   │   ├── routes/      # Express routes
│   │   │   ├── services/    # Domain and risk services
│   │   │   └── scripts/     # Synthetic-data seed script
│   │   ├── test/            # Backend unit and contract tests
│   │   └── docs/            # Runtime AI and MCP design notes
│   └── frontend/
│       ├── src/
│       │   ├── components/  # Reusable dashboard components
│       │   ├── lib/         # Frontend API client
│       │   └── pages/       # Overview, risk, fleet, cold-chain, assistant pages
│       └── package.json
├── docs/
│   ├── demo-script.md      # Timed three-minute demo runbook
│   └── qa-report.md        # Existing QA evidence and limitations
├── demo/                   # Video, live-demo, and screenshot artifacts
├── presentation/           # Slide deck location
├── submission.yaml         # Hackathon submission metadata
├── CONTRIBUTING.md         # Submission and contribution checklist
├── .env.example
└── README.md
```

## Setup requirements

- Node.js 20 or newer
- npm 10 or newer
- A locally running MongoDB instance, or an approved MongoDB deployment
- PowerShell examples below assume Windows; use equivalent shell syntax on other platforms

Do not use real customer data, production credentials, or real provider keys for the demo.

## Environment variables

Copy the root example to `src/backend/.env` and the frontend example to `src/frontend/.env`.
The actual `.env` files are ignored by Git.

### Backend: `src/backend/.env`

| Variable | Required | Default / example | Purpose |
|---|---:|---|---|
| `PORT` | No | `8000` | API port |
| `HOST` | No | `127.0.0.1` | Listener host; local-only by default |
| `API_ACCESS_KEY` | Yes for non-health routes | blank in example | Environment-only API key, minimum 16 characters |
| `MONGODB_URI` | No | `mongodb://127.0.0.1:27017/supplyguard` | MongoDB connection URI |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | No | `5000` | MongoDB startup selection timeout |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed frontend origin |
| `RUNTIME_AI_PROVIDER` | No | `disabled` | `disabled` by default; `external` is reserved for a future adapter |
| `RUNTIME_AI_BASE_URL` | Future adapter only | blank | Future provider endpoint |
| `RUNTIME_AI_MODEL` | Future adapter only | blank | Future provider model |
| `RUNTIME_AI_API_KEY` | Future adapter only | blank | Future provider secret; never commit it |
| `RUNTIME_AI_TIMEOUT_MS` | No | `5000` | Runtime AI timeout, bounded to 250-30000 ms |
| `RUNTIME_AI_MAX_CONTEXT_RECORDS` | No | `25` | Maximum trusted context records |
| `RUNTIME_AI_MAX_ANSWER_CHARACTERS` | No | `4000` | Maximum validated AI answer length |

`AI_API_KEY` remains only as a legacy placeholder in the example file. Runtime code uses
`RUNTIME_AI_API_KEY`.

### Frontend: `src/frontend/.env`

| Variable | Required | Default / example | Purpose |
|---|---:|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:8000/api` | Backend API base URL |
| `VITE_API_ACCESS_KEY` | When backend key is configured | blank | Sends the matching API key to protected API routes |

Never put database credentials or runtime provider credentials in frontend variables. Vite
variables are exposed to browser code.

## Installation

From the repository root:

```powershell
Copy-Item .env.example src/backend/.env
Copy-Item src/frontend/.env.example src/frontend/.env

Set-Location src/backend
npm install

Set-Location ..\frontend
npm install
```

Before using any non-health API route, set the same random, non-committed value in
`src/backend/.env` as `API_ACCESS_KEY` and in `src/frontend/.env` as `VITE_API_ACCESS_KEY`. The backend
intentionally refuses unauthenticated non-health requests when the key is missing.

## MongoDB setup

1. Start MongoDB locally.
2. Use the default local URI, or set `MONGODB_URI` to an approved database.
3. Keep database credentials outside Git and outside frontend configuration.
4. The backend uses a five-second default server-selection timeout so a missing database fails
   clearly instead of hanging indefinitely.

## Seed synthetic data

Run from `src/backend`:

```powershell
Set-Location src/backend
npm run seed:synthetic
```

The seed is upsert-only by default and creates repeatable synthetic shipments, disruptions,
vehicles, sensor logs, and recommendations. It refuses to run in production.

To reset only deterministic seed records, use a localhost MongoDB URI and explicitly opt in:

```powershell
$env:SEED_ALLOW_DESTRUCTIVE = "true"
npm run seed:synthetic -- --reset
```

## Start the applications

Use two terminals.

### Backend

```powershell
Set-Location src/backend
npm run dev
```

The API normally listens at `http://127.0.0.1:8000`. Health check:

```text
GET http://localhost:8000/api/health
```

For a non-watching process:

```powershell
Set-Location src/backend
npm start
```

### Frontend

```powershell
Set-Location src/frontend
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`.

## API endpoints

Successful responses use `{ "data": ... }`; paginated collection responses also include a
`pagination` object. Only the health route is intentionally unauthenticated. Other routes accept
`X-API-Key` or `Authorization: Bearer <key>`.

### Health

- `GET /api/health`

### Shipments and disruptions

- `GET /api/shipments?page=1&limit=20&status=delayed&riskLevel=high&priority=critical&region=Indiana`
- `GET /api/shipments/:shipmentId`
- `GET /api/disruptions?page=1&limit=20&status=active&severity=high&region=Indiana`

### Fleet

- `GET /api/fleet?page=1&limit=20&status=available&region=Indiana&minUtilization=0&maxUtilization=80`
- `GET /api/fleet/intelligence`
- `GET /api/fleet/:vehicleId`
- `GET /api/fleet/suggestions?shipmentId=SG-0001`

### Sensors and cold chain

- `GET /api/sensors?page=1&limit=20&isExcursion=true&shipmentId=<object-id>&vehicleId=<object-id>`
- `GET /api/cold-chain/summary`
- `GET /api/cold-chain/alerts?page=1&limit=20&severity=critical`
- `GET /api/cold-chain/shipments/:shipmentId`

### Dashboard and risk

- `GET /api/dashboard/summary`
- `GET /api/risk/shipments?page=1&limit=20&riskLevel=CRITICAL&priority=critical&status=at_risk&temperatureExcursion=true&delayStatus=delayed`
- `GET /api/risk/shipments/:shipmentId`
- `GET /api/risk/summary`
- `GET /api/risk/recommendations`

### Assistant

- `POST /api/assistant/ask`

Request body:

```json
{
  "question": "Which shipments need immediate attention?"
}
```

## AI setup and IBM Bob distinction

IBM Bob is the development assistant used to help build, test, and document this repository. IBM
Bob is **not** the runtime AI provider and is never called by the deployed application.

Runtime AI is disabled by default:

```dotenv
RUNTIME_AI_PROVIDER=disabled
```

The backend currently implements the provider-neutral assistant contract, trusted context
construction, prompt templates, timeout/error codes, response validation, and a deterministic
fallback response when the provider is disabled. The fallback uses application records only,
labels itself `deterministic-fallback`, and never claims that a model answered.

`RUNTIME_AI_PROVIDER=external` and the related base URL/model/key variables describe the reserved
future adapter boundary. A working external provider adapter is not included in this repository,
so do not claim that external runtime AI is operational until an approved adapter is implemented
and tested. Never commit `RUNTIME_AI_API_KEY`.

## MCP support

SupplyGuard does **not** currently expose an MCP server, SDK, or transport. It includes a
read-only MCP-style adapter boundary in `src/backend/src/ai/mcpTools.js`.

The current tool abstraction:

- Uses existing domain services rather than exposing MongoDB
- Allow-lists tool names and input keys
- Validates shipment/vehicle identifiers and pagination
- Limits list results
- Returns read-only results
- Does not support writes, arbitrary queries, credentials, or unrestricted database tools

Available future adapter tools include shipment lookup, high-risk shipment lookup, disruption
lookup, available vehicles, temperature alerts, fleet summary, and deterministic shipment risk.
See [src/backend/docs/mcp-tools.md](src/backend/docs/mcp-tools.md) for the complete contract.

## Testing

Run backend commands from `src/backend`:

```powershell
npm run check
npm run test:risk
npm run test:fleet
npm run test:cold-chain
npm run test:ai-contract
npm run test:assistant
npm run test:mcp
```

Build the frontend from `src/frontend`:

```powershell
npm run build
```

The existing QA report records backend regression results, synthetic seed validation, API smoke
checks, assistant-disabled fallback behavior, secret scanning, and desktop/mobile layout checks:
[docs/qa-report.md](docs/qa-report.md).

## Screenshots

No binary screenshots are committed currently. Recommended screenshots for a project
demonstration are:

1. Overview dashboard with shipment KPIs and risk distribution
2. Critical shipment risk detail with rules and recommended action
3. Fleet utilization with an available vehicle
4. Cold-chain alerts and temperature detail
5. Assistant structured response or the provider-unavailable fallback
6. Mobile navigation and responsive dashboard

Capture screenshots only from the synthetic-data environment and avoid credentials, tokens, or
real operational data. Add approved images under `docs/screenshots/` and link them here when
available.

## Demo video

No demo video is committed currently. The timed three-minute walkthrough is documented in
[docs/demo-script.md](docs/demo-script.md). It includes exact clicks, supported assistant
questions, expected evidence, business value, and a deterministic fallback when runtime AI is
unavailable.

## Known limitations

- The included MongoDB dataset is synthetic and not representative of live customer data.
- Runtime AI is disabled by default and no working external provider adapter is included.
- MCP transport and MCP SDK are not installed or enabled.
- The current API key is an MVP service-level control, not user identity, tenant isolation, or
  role-based authorization.
- Production deployments still require HTTPS, secret management, least-privilege MongoDB access,
  network controls, and OIDC/JWT-based authorization.
- The Disruptions navigation route currently provides a workspace placeholder; live disruption
  records are shown on the Overview page and through the backend API.
- No operational write workflows are implemented: vehicle suggestions remain manual review only.
- Automated browser accessibility testing is not included; existing QA uses accessibility
  heuristics.

## Future improvements

- Add an approved OIDC/JWT identity provider with tenant and role authorization.
- Implement and security-review a real server-side runtime AI adapter.
- Add production MCP transport only behind the existing read-only service boundary.
- Add richer shipment and disruption list pages backed by their APIs.
- Add automated browser, accessibility, and visual-regression tests.
- Add observability with redacted request IDs, latency, provider status, and error metrics.
- Add deployment manifests, HTTPS configuration, secret-manager integration, and CI security scans.
- Add approved dashboard screenshots and a recorded synthetic-data demo.

## Team member responsibilities

No named team roster is stored in this repository. The implementation responsibilities are
organized as follows and can be mapped to team members for delivery:

| Responsibility | Scope |
|---|---|
| Product/demo owner | Use cases, three-minute demo flow, acceptance criteria, and business-value narrative |
| Frontend owner | React pages, navigation, responsive layout, accessibility, loading/error states, and screenshots |
| Backend/data owner | Express routes, Mongoose models, services, MongoDB connectivity, and synthetic seed data |
| Risk/AI owner | Deterministic risk engine, trusted context, prompt contract, response validation, and provider integration |
| Platform/security owner | Environment secrets, API protection, rate limits, deployment configuration, security review, and CI |
| QA owner | Unit/contract tests, API smoke checks, responsive checks, seeded-data verification, and release evidence |

## License

No license file is currently included in this repository. Unless the project owners add a
license, the source should be treated as all rights reserved and not redistributed.
