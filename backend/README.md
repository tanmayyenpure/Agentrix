# FlowForge — Backend Core

This is the backend core slice of the FlowForge PRD: **authentication, workflow CRUD, and the
workflow execution engine**, built with Java 21 + Spring Boot, matching the PRD's stack.

It is a runnable foundation, not the full PRD — Scheduler, real Webhook ingestion, AI Automation,
Integration Hub, Marketplace, Team Collaboration, Versioning UI, and the React frontend are **not**
included. See "What's not here" below.

## ⚠️ Not yet verified by a real build

This sandbox's network only allows package downloads from npm, PyPI, and crates.io registries —
not Maven Central — so I was not able to run `mvn compile` here to confirm it builds clean.
The code has been written carefully and reviewed by hand, but **please run `mvn clean compile`
yourself the first time** and tell me what comes back if anything fails — happy to fix it fast.

## Stack

Java 21, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, H2 (default, zero-setup) /
PostgreSQL (`postgres` profile), Lombok, jjwt.

## Project layout

```
src/main/java/com/flowforge/
  model/             Entities: User, Role, Organization, Workflow, WorkflowNode, WorkflowEdge,
                      Execution, ExecutionLog (matches the PRD's Database Entities list)
  repository/        Spring Data JPA repositories
  dto/               Request/response payloads
  security/          JWT generation/validation, UserDetails
  config/            Spring Security config, JWT filter, role seeder
  service/           AuthService, WorkflowService, ExecutionService
  service/execution/ The execution engine: NodeExecutor strategy interface + per-node-type
                      implementations (Trigger, Log, Delay, HttpRequest, Condition, Transform)
  controller/        REST controllers
  exception/         Centralized error handling
```

## Running it

No database setup needed for local dev — defaults to an in-memory H2 database.

```bash
mvn spring-boot:run
```

The API comes up on `http://localhost:8080`. Inspect the in-memory DB at
`http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:flowforge`, user `sa`, no password).

To run against real PostgreSQL (matching the PRD stack exactly):

```bash
docker run -d --name flowforge-db -e POSTGRES_DB=flowforge -e POSTGRES_USER=flowforge \
  -e POSTGRES_PASSWORD=flowforge -p 5432:5432 postgres:16

mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

## API walkthrough

**1. Register** (creates an Organization + an admin User):
```bash
curl -X POST localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{
  "fullName": "Tanmay Yenpure",
  "email": "tanmay@example.com",
  "password": "password123"
}'
```
Returns a JWT in `token`. Use it as `Authorization: Bearer <token>` on everything below.

**2. Create a workflow** — a two-node flow: trigger → log:
```bash
curl -X POST localhost:8080/api/workflows -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{
  "name": "Hello Workflow",
  "description": "Logs whatever input it receives",
  "nodes": [
    {"clientId": "n1", "type": "TRIGGER_MANUAL", "label": "Start"},
    {"clientId": "n2", "type": "LOG", "label": "Print input"}
  ],
  "edges": [
    {"sourceClientId": "n1", "targetClientId": "n2"}
  ]
}'
```

**3. Run it:**
```bash
curl -X POST localhost:8080/api/workflows/1/executions -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"inputPayload": "{\"order_id\": 42}"}'
```
Response includes a per-node `logs` array with status, output, and duration — this is the
Execution Logs feature from the PRD.

**4. List past executions / fetch one:**
```bash
curl localhost:8080/api/workflows/1/executions -H "Authorization: Bearer $TOKEN"
curl localhost:8080/api/executions/1 -H "Authorization: Bearer $TOKEN"
```

## The execution engine

`ExecutionEngineService` walks the workflow's node graph breadth-first starting from "root" nodes
(nodes with no incoming edge — i.e. triggers). Each node type has a small `NodeExecutor`
implementation (strategy pattern), so adding a new node type later (e.g. a Slack node, an AI node
for Phase 4) means writing one new class and registering it — no changes to the engine itself.

Supported node types today:
| Type | Behavior |
|---|---|
| `TRIGGER_MANUAL` / `TRIGGER_WEBHOOK` / `TRIGGER_SCHEDULE` | Seeds the run with the input payload |
| `LOG` | Writes to the app log |
| `DELAY` | Sleeps (config: `{"seconds": 5}`, capped at 30s) |
| `HTTP_REQUEST` | Makes a real outbound HTTP call (config: `url`, `method`, `body`) |
| `CONDITION` | Branches the graph based on comparing an upstream node's output (config: `sourceNode`, `operator`, `value`) |
| `TRANSFORM` | `{{nodeId}}` template substitution using upstream outputs |

A failed node stops propagation down that branch but the engine still finishes the run and records
every node's outcome, so a partial failure is fully visible in the execution logs.

## What's not here (left for later phases per the PRD roadmap)

- Scheduler (cron-based triggers) — `TRIGGER_SCHEDULE` exists as a node type but nothing fires it yet
- Real inbound Webhooks (an HTTP endpoint that starts a run) — only outbound `HTTP_REQUEST` exists
- Kafka event bus, Redis caching
- AI Automation / AI Workflow Generator / AI Agents (Phase 2–4)
- Integration Hub, Marketplace, Notifications, Audit Trails, Versioning UI
- Team Collaboration / multi-user workflow sharing (workflows are single-owner right now)
- The React + React Flow frontend
- Prometheus/Grafana monitoring, Docker packaging
- Automated tests

## Suggested next step

Once you've confirmed this builds and runs, a good next slice would be either:
- the React Flow drag-and-drop builder frontend that talks to this API, or
- inbound webhooks + the scheduler, so workflows can trigger themselves instead of only via API call
