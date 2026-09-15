# SupplyGuard Runtime AI Service Design

## Boundary

IBM Bob is the development assistant used to help build, test, and document SupplyGuard. It is not the runtime inference provider. Runtime model access must go through a separately configured provider adapter.

The current implementation intentionally stops at the service contract. `RUNTIME_AI_PROVIDER=disabled` is the default, and the base provider returns `501 AI_PROVIDER_NOT_CONFIGURED` rather than producing fake answers.

## 1. AI service interface

The application-facing interface is `RuntimeAIProvider`:

- `answerLogisticsQuestion(request)`
- `explainShipmentRisk(request)`
- `summarizeRecommendation(request)`

Each method accepts a bounded trusted context and returns the validated response contract:

```text
{
  answer: string,
  keyFacts: string[],
  affectedShipments: string[],
  affectedVehicles: string[],
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null,
  recommendations: string[],
  limitations: string[],
  sourceReferences: [{ source, recordId, field }],
  dataUnavailable: boolean,
  provider: string,
  generatedAt: ISO timestamp
}
```

Supported question intents are defined in `src/ai/contextBuilder.js`: immediate attention, risk explanation, delayed shipments, idle vehicles, vehicle suggestions, cold-chain alerts, disruptions, and first action.

The interface must never mutate shipments, vehicles, disruptions, sensors, or recommendations.

## 2. Provider configuration

`providerConfig.js` supports:

- `disabled`: safe local/default mode
- `external`: reserved for a future separately implemented adapter

A provider adapter must be selected by configuration and injected into application services. No controller or frontend may call a model SDK directly.

## 3. Environment variables

- `RUNTIME_AI_PROVIDER`: `disabled` or `external`
- `RUNTIME_AI_BASE_URL`: provider endpoint; never log it with credentials
- `RUNTIME_AI_MODEL`: provider model identifier
- `RUNTIME_AI_API_KEY`: secret, environment-only
- `RUNTIME_AI_TIMEOUT_MS`: 250-30000, default 5000
- `RUNTIME_AI_MAX_CONTEXT_RECORDS`: 1-100, default 25
- `RUNTIME_AI_MAX_ANSWER_CHARACTERS`: 100-10000, default 4000

`AI_API_KEY` remains only a legacy placeholder. New runtime code must use `RUNTIME_AI_API_KEY` and must not treat IBM Bob as its value.

## 4. Prompt templates

Prompt templates are provider-neutral constants in `promptTemplates.js`, rendered by `buildPrompt()`. They require:

- Answer only from supplied context
- Cite source references for factual claims
- Say `Data unavailable in the current SupplyGuard records.` when evidence is missing
- Never recalculate risk
- Never claim an action was executed

A future adapter should put the user question and serialized trusted context into a provider-specific request, with secrets kept outside prompt text.

## 5. Context preparation

`trustedContext.js` defines the only approved sources:

- MongoDB shipment and record data
- Deterministic risk engine output
- Disruption service output
- Fleet service output
- Sensor service output

Context preparation must:

1. Validate the user question and supported intent.
2. Retrieve records through existing services, not arbitrary model queries from the provider.
3. Preserve stable IDs and source fields.
4. Bound the number of records.
5. Remove credentials, internal stack traces, and unrelated fields.
6. Mark missing records explicitly as unavailable.

## 6. Response validation

`responseContract.js` rejects responses that do not include a non-empty answer, source references, a data-availability flag, and provider identity. The adapter must validate record references against the context before returning a response.

A response cannot introduce a new shipment ID, risk score, vehicle ID, sensor value, disruption, or delivery date that is absent from context.

## 7. Error handling

Use stable error codes:

- `AI_PROVIDER_NOT_CONFIGURED`: no adapter is available; return a controlled `501` at the future API boundary.
- `AI_CONFIG_INVALID`: invalid limits or timeout.
- `AI_CONFIG_INCOMPLETE`: enabled provider lacks required configuration.
- `AI_PROVIDER_TIMEOUT`: provider exceeded the request deadline.
- `AI_PROVIDER_UNAVAILABLE`: provider returned a network or service failure.
- `AI_RESPONSE_INVALID`: provider output failed schema or grounding validation.

Do not expose provider response bodies, prompts, API keys, or stack traces to clients.

## 8. Timeout handling

Every provider request must use an abortable timeout from `RUNTIME_AI_TIMEOUT_MS`. There is one bounded retry only for explicitly transient failures, with no retry for validation failures or authentication failures. On timeout, use the deterministic fallback response.

## 9. Fallback behavior

Fallback is not fake AI. It is an explicit deterministic response assembled from trusted records:

- Return facts and rule explanations from the risk engine.
- Return fleet suggestions from fleet service.
- Return sensor facts from cold-chain service.
- State when requested data is unavailable.
- Never imitate a model-generated answer or claim model use.

The UI should label fallback responses as deterministic when a future assistant endpoint exposes them.

## 10. Logging strategy

Log only operational metadata:

- Request ID
- Intent
- Provider name
- Duration
- Timeout or error code
- Number of context records
- Number of source references

Never log API keys, full prompts, raw model responses, user secrets, or unrestricted shipment data. Use redacted IDs or stable record IDs according to the deployment privacy policy.

## 11. Hallucination prevention

- Use a closed source context.
- Require source references.
- Validate every cited record ID and field.
- Keep deterministic risk score authoritative.
- Set `dataUnavailable=true` when evidence is absent.
- Reject unsupported questions or ask for a narrower supported question.
- Limit response length.
- Do not let the model issue writes or operational commands.
- Do not use model output to update database risk fields without human-reviewed deterministic logic.

The response validator also checks that affected shipment IDs, vehicle IDs, and source record IDs occur in the trusted context. Unsupported entities are rejected before an answer can leave the service layer.

## 12. Security rules

- Store credentials only in environment variables or a secret manager.
- Do not expose runtime credentials to the frontend.
- Keep AI calls server-side.
- Use HTTPS outside local development.
- Apply rate limits to future assistant endpoints.
- Validate and bound user questions and context size.
- Sanitize provider errors.
- Use least-privilege provider and MongoDB credentials.
- Keep all demo data synthetic.
- Treat retrieved database text as untrusted data; it must not override system constraints.

## Future adapter flow

```text
API request
-> intent validation
-> MongoDB-backed service queries
-> deterministic risk/fleet/cold-chain context
-> trusted context validator
-> provider adapter with timeout
-> response schema validator
-> source-reference validator
-> redacted response
```
