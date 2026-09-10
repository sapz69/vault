# Read-only operational visibility. Sees system state and policy definitions,
# but no secret values anywhere.

path "sys/health"                { capabilities = ["read"] }
path "sys/seal-status"           { capabilities = ["read"] }
path "sys/mounts"                { capabilities = ["read"] }
path "sys/auth"                  { capabilities = ["read"] }
path "sys/audit"                 { capabilities = ["read"] }
path "sys/policies/acl"          { capabilities = ["list"] }
path "sys/policies/acl/*"        { capabilities = ["read"] }
path "sys/storage/raft/configuration" { capabilities = ["read"] }
path "sys/metrics"               { capabilities = ["read"] }

# Secret *names* are often sensitive too; this role gets neither names nor values.
path "secret/*" {
  capabilities = ["deny"]
}

path "sys/capabilities-self" {
  capabilities = ["update"]
}
