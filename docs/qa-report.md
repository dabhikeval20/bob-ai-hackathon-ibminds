# SupplyGuard AI QA Report

Date: 2026-09-14
Environment: Windows, Node.js 22.18.0, local MongoDB, seeded synthetic data, Vite frontend, Express backend

## Summary

- Backend automated tests: 40 passed.
- Frontend production build: passed after fixing Windows Vite command resolution.
- MongoDB connectivity and synthetic seed: passed.
- Live API families: passed.
- Desktop and mobile route checks: passed with no horizontal overflow.
- Assistant fallback when provider is disabled: passed.
- Real external AI provider response: not run because no provider credentials are configured.
- No real secrets detected by credential-shaped scan.

## Test Cases

| ID | Test description | Expected result | Actual result | Status | Screenshot requirement | Bug severity | Suggested fix |
|---|---|---|---|---|---|---|---|
| QA-F01 | Run backend module check | Backend imports and starts configuration successfully | `npm run check` passed | PASS | No | None | None |
| QA-F02 | Run all backend regression suites | Risk, fleet, cold-chain, AI, assistant, and MCP tests pass | 40 tests passed | PASS | No | None | None |
| QA-F03 | Seed synthetic database | Seed connects, validates, and inserts repeatable records | 20 shipments, 5 disruptions, 15 vehicles, 26 sensor logs, 5 recommendations | PASS | Recommended demo artifact | None | None |
| QA-F04 | Dashboard summary API | Return computed shipment, disruption, fleet, and temperature metrics | HTTP 200; total shipments 20; temperature alerts 4 in dashboard aggregation | PASS | No | None | None |
| QA-F05 | Shipment list and detail APIs | Return shipment data and handle valid records | List HTTP 200; risk detail for `SG-0001` HTTP 200 | PASS | No | None | None |
| QA-F06 | Risk summary/detail APIs | Return deterministic levels, score, rules, reasons, and actions | HTTP 200; critical shipment detail and explanations rendered | PASS | Recommended risk screenshot | None | None |
| QA-F07 | Fleet intelligence APIs | Return computed totals, utilization, details, and suggestions | HTTP 200; 15 vehicles, 7 available, 1 idle, 4 overutilized; suggestions flagged manual-only | PASS | Recommended fleet screenshot | None | None |
| QA-F08 | Sensor and cold-chain APIs | Return readings, latest temperature, safe ranges, severity, duration | HTTP 200; 2 alert shipments with 30-minute excursions | PASS | Recommended cold-chain screenshot | None | None |
| QA-F09 | Missing shipment | Return controlled not-found response | HTTP 404 `SHIPMENT_NOT_FOUND` | PASS | No | None | None |
| QA-F10 | Invalid shipment ID | Reject malformed identifiers | HTTP 400 `INVALID_SHIPMENT_ID` | PASS | No | None | None |
| QA-F11 | Empty database | Return zero metrics and empty collections without failure | Isolated empty database server returned dashboard totals of 0 and empty shipment list HTTP 200 | PASS | No | None | None |
| QA-F12 | API server unavailable | Client/network probe should fail as unavailable; UI should expose an error state | Request to unused port returned `ECONNREFUSED`; browser error states were exercised | PASS | Optional error-state screenshot | None | None |
| QA-F13 | MongoDB unavailable | Backend should fail clearly rather than serve misleading data | Startup with unreachable MongoDB exited with `MongooseServerSelectionError` and `ECONNREFUSED` within configured timeout | PASS | No | None | None |
| QA-F14 | AI provider unavailable/not configured | Return grounded deterministic fallback and no fake answer | POST `/api/assistant/ask` returned HTTP 200 with `provider=deterministic-fallback`, trusted IDs, and manual-review limitations | PASS | Recommended assistant fallback screenshot | None | None |
| QA-F15 | Invalid user question | Reject empty or unsupported questions | Unit tests passed for empty and unsupported questions with HTTP 400 application errors | PASS | No | None | None |
| QA-F16 | Missing sensor data | Show unavailable values without fabricating readings | Cold-chain unit test returned null latest reading and explicit unavailable explanation | PASS | Optional empty-state screenshot | None | None |
| QA-F17 | Temperature excursion | Detect alert, severity, safe range, and duration | Unit and live tests passed; SG-0001 displayed critical, 10.8°C, 30 minutes, safe range 2–8°C | PASS | Recommended alert/detail screenshot | None | None |
| QA-F18 | Critical shipment risk | Show HIGH/CRITICAL badge, score, reasons, and action | SG-0002 rendered CRITICAL 83/100 with six reasons and escalation recommendation | PASS | Recommended risk-detail screenshot | None | None |
| QA-F19 | No available vehicles | Empty suggestions should be explicit and never assign | Unit test covered no compatible suggestion path and `assignmentPerformed: false` contract | PASS | Optional empty-state screenshot | None | None |
| QA-F20 | Desktop responsive layout | Pages fit without horizontal overflow | Overview, risk, fleet, cold-chain, assistant, and detail routes passed at 1440px | PASS | Recommended screenshots | None | None |
| QA-F21 | Mobile responsive layout | Pages fit mobile viewport and retain navigation | Major routes passed at 390px with no horizontal overflow; mobile menu present | PASS | Recommended mobile screenshot | None | None |
| QA-F22 | Accessibility heuristics | Inputs have labels, buttons have names, tables have captions | Assistant input labeled; buttons named; overview/fleet/cold-chain tables have captions; no unnamed buttons found | PASS | Optional accessibility evidence | Low | Add automated axe scan before production release |
| QA-F23 | Loading states | Slow API should show visible loading UI | 600ms delayed API probe showed overview loading status; assistant displayed “Reviewing trusted logistics data...” | PASS | Optional loading screenshot | None | None |
| QA-F24 | Error states | Provider/API errors should be visible and retryable | Assistant fallback showed alert and Retry; API failure states were exercised in browser | PASS | Optional error screenshot | None | None |
| QA-F25 | AI response with configured provider | Real configured provider returns validated structured response | Not run: no runtime provider credentials configured; mock-provider unit tests passed structured response, invalid response, and unsupported-claim validation | NOT RUN | Required before production AI release | Medium | Configure a real approved provider in a secure environment and rerun |
| QA-F26 | AI unsupported claim | Reject shipment/vehicle/source IDs absent from trusted context | Unit test rejected `NOT-IN-CONTEXT` as `AI_RESPONSE_INVALID` | PASS | No | None | None |
| QA-F27 | Security secret scan | No real API keys, private keys, or credential-bearing MongoDB URLs committed | Credential-shaped scan found no real secret patterns outside documented examples/placeholders | PASS | No | None | None |
| QA-F28 | API performance smoke | Representative local APIs should respond within practical local-demo latency | Five-request smoke: dashboard avg 5.9ms, risk 7.1ms, fleet 3.7ms, cold-chain 6.0ms; health avg 10.0ms | PASS | No | None | None |
| QA-F29 | Deployment readiness | Build and normal startup commands work | Frontend `npm run build` and `npm run dev` pass after script fix; backend check/start pass; env examples documented | PASS | No | None | None |

## Fixed During QA

### Windows Vite command resolution

The workspace path contains an ampersand. Windows npm scripts that invoked the Vite `.cmd` shim failed with a path-resolution error. The frontend scripts now invoke Vite through Node directly:

- `dev`: `node ./node_modules/vite/bin/vite.js`
- `build`: `node ./node_modules/vite/bin/vite.js build`

Both normal commands were rerun successfully.

### MongoDB startup timeout

MongoDB connection startup now uses `MONGODB_SERVER_SELECTION_TIMEOUT_MS`, defaulting to 5000ms, so unreachable MongoDB fails predictably instead of retrying indefinitely. The variable is documented in `.env.example`.

## Known Limitations

- No real runtime AI provider is configured in this environment, so external-provider end-to-end response testing remains `NOT RUN`.
- MCP transport is not installed; only the read-only tool abstraction is tested.
- Accessibility testing used structural browser heuristics, not a full automated axe or screen-reader run.
- Performance measurements are local smoke timings, not load-test results.
- The application uses synthetic data only.

## Release Recommendation

The application is suitable for a local synthetic-data demonstration. Before production or judging with runtime AI enabled, configure an approved provider securely, rerun QA-F25, perform a full accessibility scan, and run deployment-environment smoke tests.
