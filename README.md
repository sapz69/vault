# Himitsu Vault

A distribution of [OpenBao](https://openbao.org) 2.0.0, rebranded as Himitsu Vault, with a
custom dashboard in the Ember UI.

The backend under `openbao/` is **unmodified upstream OpenBao** — no Go source in this
repository differs from upstream. All customisation is in `openbao/ui/`.

## Running it locally

The default `docker compose up` will **not** work: this repo has no root
`docker-compose.yml` (the file that used to sit there belonged to a different project and is
kept, disabled, as `docker-compose.himitsu-api.yml.disabled`).

Use the OpenBao stack explicitly:

```bash
cp .env.example .env     # then fill in the values described below
docker compose -f docker-compose.openbao.yml -f docker-compose.local.yml -p vault up -d
```

| URL | What |
|---|---|
| `http://localhost:8220/ui/` | Server with the production UI baked in |
| `http://localhost:4210` | Live-reload dev UI (proxies the API to the server) |

Log in with the `userpass` method using `HIMITSU_ADMIN_USERNAME` / `HIMITSU_ADMIN_PASSWORD`.

## Required environment

All of these live in `.env`, which is gitignored and must never be committed.

| Variable | Purpose |
|---|---|
| `OPENBAO_HOST_PORT` | Host port the API/UI is published on (default 8210; the local override uses 8220) |
| `OPENBAO_API_ADDR` | Advertised API address — must match how clients reach the server |
| `HIMITSU_UNSEAL_KEY` | **32 random bytes, base64.** See the warning below |
| `HIMITSU_ADMIN_USERNAME` | Bootstrap admin username, created on first start |
| `HIMITSU_ADMIN_PASSWORD` | Bootstrap admin password |

Generate an unseal key with:

```bash
head -c 32 /dev/urandom | base64
```

> **Losing `HIMITSU_UNSEAL_KEY` makes the Raft storage under the `openbao-file` volume
> permanently unrecoverable.** There are no Shamir shares and no recovery key.

## Configuration

`config/openbao.hcl` is the deployed server config. It is `COPY`d into the image at
`Dockerfile.openbao`, so **changing it requires rebuilding the image**:

```bash
docker compose -f docker-compose.openbao.yml -f docker-compose.local.yml -p vault build openbao
```

The config sets up an integrated-Raft single node, a `userpass` auth mount, an `admin` policy,
a `secret/` kv-v2 mount, and a static seal that auto-unseals from `HIMITSU_UNSEAL_KEY`.

## Known limitations

These are deliberate current-state facts, not open bugs to rediscover:

- **No audit logging.** There is no `audit` stanza in `config/openbao.hcl`, and OpenBao 2.x
  refuses to enable audit devices through the API — they must be declared in config.
- **TLS is disabled** (`tls_disable = true`). Suitable for local use only.
- **The unseal key is an environment variable** and the server auto-unseals. Anyone who can
  read the environment can decrypt the store.
- **Single Raft node.** No HA, no failover.
- **Enterprise features are absent** — replication, licensing and Sentinel RGP policies return
  404. This is correct for OpenBao OSS.
- **TOTP and KMIP have no UI support.** The engines are reachable via CLI/API; the UI redirects
  to the secrets list.
- **The production UI build requires Node 20.** It fails on Node 22+ (`clean-css` calls
  `util.isRegExp`, removed in Node 22). The Dockerfiles pin Node 20.

## Building

The backend requires **Go 1.27** (`openbao/.go-version`); the Docker build uses
`golang:1.27-alpine`. Building on a host with an older Go will fail.

```bash
docker compose -f docker-compose.openbao.yml -f docker-compose.local.yml -p vault build
```

## Repository layout

| Path | What |
|---|---|
| `openbao/` | Upstream OpenBao tree (server, SDK, API, UI, website) |
| `openbao/ui/` | Ember UI — the only customised source in this repo |
| `config/openbao.hcl` | Deployed server configuration |
| `Dockerfile.openbao` | Multi-stage build: UI → Go binary → runtime image |
| `Dockerfile.ui-dev` | Live-reload UI container |
| `scripts/` | Plugin download helper used at image build |
| `docs/audit/` | Production-readiness audit (22 documents) |

## Audit

A full evidence-based audit lives in [`docs/audit/`](docs/audit/), including the outstanding
blockers and a prioritised remediation roadmap. Start with
[`01-executive-summary.md`](docs/audit/01-executive-summary.md).
