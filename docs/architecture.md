# Architecture Overview

## Services

### Client

- React + Vite + Tailwind
- Socket.IO client subscribes to live transaction and alert events
- Dashboard surfaces operational and fraud monitoring views for admins

### Server

- Express REST API for authentication, transaction simulation, and dashboard analytics
- Socket.IO broadcasts live transactions, alerts, and risk decisions
- MongoDB stores users, transactions, risk logs, and device sessions
- Redis caches recent transactions for fast risk feature lookup

### ML Service

- FastAPI inference API
- Isolation Forest anomaly detector
- Logistic calibration layer trained on SMOTE-balanced synthetic data
- Decision explainability through top contributing behavioral factors

## Risk Pipeline

1. Client or simulation engine submits a transaction.
2. Backend validates identities and retrieves recent transaction history.
3. Behavioral features are computed:
   - average amount delta
   - velocity over 1 hour and 24 hours
   - device mismatch
   - location deviation
4. Backend calls the ML service `/predict`.
5. Rule engine combines ML output with deterministic signals.
6. Final risk score is classified as `SAFE`, `SUSPICIOUS`, or `FRAUD`.
7. Transaction, device session, and audit log are persisted.
8. WebSocket events broadcast to the dashboard.

## Data Model

### `users`

- Identity and authentication data
- Profile baseline such as home city and preferred devices

### `transactions`

- Sender/receiver, amount, device, location, timestamps
- ML score, rule signals, final risk, decision

### `risk_logs`

- Full audit trail for every decision
- ML factors, triggered rules, latency, and classification

### `device_sessions`

- Device trust state, last-seen location, and session timing

## Reliability Notes

- Redis failure does not break transaction processing
- ML service timeout returns a degraded but traceable rule-based score
- Logging is centralized with Winston on the Node service
