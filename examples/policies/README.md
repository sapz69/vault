# Example ACL policies

The only policy this distribution creates on first boot is `admin`, defined in
`config/openbao.hcl`:

```hcl
path "*" {
  capabilities = ["create", "update", "patch", "read", "delete", "list", "scan", "sudo"]
}
```

That is deliberately omnipotent so the bootstrap account can do anything. It is **not** a
model for day-to-day accounts, and shipping it as the only example makes the all-powerful
token the path of least resistance.

The policies here are least-privilege starting points. They are **examples, not applied
configuration** — nothing loads them automatically.

## Applying one

```bash
bao policy write secrets-reader examples/policies/secrets-reader.hcl
bao write auth/userpass/users/alice password=... token_policies=secrets-reader
```

## Verifying what a token can actually do

Never assume a policy works — check it:

```bash
bao token create -policy=secrets-reader -field=token > /tmp/t
BAO_TOKEN=$(cat /tmp/t) bao kv get   -mount=secret app/db-creds   # expect: success
BAO_TOKEN=$(cat /tmp/t) bao kv put   -mount=secret app/x k=v      # expect: 403
```

`bao token capabilities <token> <path>` reports the effective capabilities on a single path.
