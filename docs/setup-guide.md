# SupplyGuard AI setup guide

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A local MongoDB instance or approved MongoDB deployment
- PowerShell for the commands below on Windows

## Configure environment files

From the repository root:

```powershell
Copy-Item .env.example src/backend/.env
Copy-Item src/frontend/.env.example src/frontend/.env
```

Set a random, uncommitted value of at least 16 characters in both files:

```dotenv
# src/backend/.env
API_ACCESS_KEY=replace-with-a-local-random-key

# src/frontend/.env
VITE_API_ACCESS_KEY=replace-with-the-same-local-random-key
```

Do not put MongoDB or runtime provider credentials in frontend variables.

## Install

```powershell
Set-Location src/backend
npm install
Set-Location ..\frontend
npm install
```

## MongoDB and synthetic data

Start MongoDB, confirm it is reachable, and seed the repeatable synthetic dataset:

```powershell
Set-Location src/backend
npm run seed:synthetic
```

The seed is upsert-only by default and refuses to run in production. It creates synthetic
shipments, disruptions, fleet vehicles, sensor logs, and recommendations.

## Run

Use two terminals:

```powershell
# Terminal 1
Set-Location src/backend
npm run dev
```

```powershell
# Terminal 2
Set-Location src/frontend
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is
`http://127.0.0.1:8000/api/health`.

## Tests and build

```powershell
Set-Location src/backend
npm run check
npm run test:risk
npm run test:fleet
npm run test:cold-chain
npm run test:ai-contract
npm run test:assistant
npm run test:mcp

Set-Location ..\frontend
npm run build
```

Runtime AI is disabled by default. The assistant returns a grounded deterministic fallback
labelled `deterministic-fallback` unless a separately implemented provider adapter is available.
IBM Bob is not the runtime provider.
