# Phase 27 deployment preparation

This Compose profile is a **single-host staging baseline**, not a claim
that every feature is production hardened. It runs the static frontend,
FastAPI, and PostgreSQL behind one Nginx origin. Port 8000 is also
published for local Vite development; production firewalls should keep it
private and expose only the frontend ingress.

## Secrets and first deployment

Use a secret manager or deployment environment variables in a real host.
Do not commit `.env` files. Compose loads `backend/.env` into the API
container. Root `.env` supplies Compose interpolation values. For a local
rehearsal, create both files from their example templates:

The backend environment template previously contained credential-like
Groq/JWT values and now contains placeholders. Revoke and rotate any real
Groq key or JWT secret that may have been committed or shared; `.gitignore`
does not remove secrets from existing Git history. If history was pushed,
purge it before publishing further commits.

```powershell
$env:POSTGRES_PASSWORD = (python -c "import secrets; print(secrets.token_hex(32))")
$env:JWT_SECRET_KEY = (python -c "import secrets; print(secrets.token_urlsafe(48))")
$env:GROQ_API_KEY = "<a newly issued key, if AI is enabled>"
```

Alternatively, put `POSTGRES_PASSWORD`, `JWT_SECRET_KEY`, and
`GROQ_API_KEY` in the deployment environment, or keep the key in
`backend/.env`. A root `.env` is for Compose interpolation and is not
merged into the container automatically. Do not set the key in a `VITE_*`
value.

`POSTGRES_PASSWORD` should be hexadecimal because Compose inserts it into
the database URL. `JWT_SECRET_KEY` must be unique and at least 32
characters. Set `FRONTEND_ORIGIN` to the externally visible HTTPS origin
when the browser and Nginx are behind a TLS ingress.

Build, apply migrations as a deliberate release step, then start services:

```powershell
docker compose build
docker compose run --rm api alembic upgrade head
docker compose up -d
```

Open `http://localhost:8080` for the local rehearsal. For a real deployment,
put a managed TLS ingress/load balancer in front, enforce HTTPS there, and
publish only that ingress. Verify `/health/live` for process liveness and
`/health/ready` for PostgreSQL readiness. Swagger/OpenAPI is disabled in
production mode.

## Explicit limits before public launch

- `EXECUTION_ENABLED=false` is enforced in production. The API executes
  student code by controlling Docker; mounting the host Docker socket into
  a public API container gives that service broad host control. A separate,
  authenticated, resource-limited execution worker on an isolated host or
  microVM is required before enabling Run/Submit for untrusted users.
- Browser bearer tokens remain in local storage. Replace them with a
  secure, httpOnly cookie/session design and CSRF protections before
  handling valuable accounts.
- Nginx applies a small per-IP limit to signup/signin. Put equivalent
  limits at the public ingress too, especially if Nginx is scaled across
  replicas; process-local limits are not a distributed abuse control.
- Configure encrypted, tested PostgreSQL backups and a restore exercise.
  Persist and back up the API's `/data` volume for Chroma knowledge/memories
  and the downloaded embedding model. Restrict access to logs; request IDs are safe to
  share with support, bearer tokens and prompts are not.
- Set monitoring/alerts for API 5xx/latency, database saturation, disk
  usage, memory, and failed readiness. Define retention and deletion
  policies for user memories, submissions, and logs.
- Configure ingress TLS, forwarded-header trust, firewall rules, secret
  rotation, dependency scanning, and a tested rollback process. Do not
  trust arbitrary forwarded headers from direct internet traffic.
- The local Sentence Transformers model downloads or initializes on first
  use and can consume substantial memory. Prewarm it in a controlled
  rollout and measure startup/readiness against your selected host size.
- Admin seed accounts are development-only. Never run the demo seed step
  against a public database; provision the first admin out of band.

The checked-in Compose file deliberately omits host Docker access and
therefore leaves code execution unavailable. It is a deployment scaffold;
it does not replace infrastructure review, load testing, secret management,
or a production execution architecture.
