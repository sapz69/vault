ui = true
disable_mlock = true

plugin_directory = "/openbao/plugins"

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

storage "raft" {
  path    = "/openbao/file"
  node_id = "himitsu-vault-node-1"
}

cluster_addr = "http://127.0.0.1:8201"

seal "static" {
  current_key_id = "himitsu-1"
  current_key    = "env://HIMITSU_UNSEAL_KEY"
}

initialize "authentication" {
  request "mount-userpass" {
    path      = "sys/auth/userpass"
    operation = "create"
    data = {
      type        = "userpass"
      description = "Himitsu Vault administrative access."
    }
  }

  request "create-user" {
    path      = "auth/userpass/users/admin"
    operation = "create"
    data = {
      password = {
        eval_source = "env"
        eval_type   = "string"

        env_var         = "HIMITSU_ADMIN_PASSWORD"
        require_present = true
      }

      token_policies = ["admin"]
    }
  }

  request "create-policy" {
    operation = "create"
    path      = "sys/policies/acl/admin"
    data = {
      policy = <<EOP

path "*" {
  capabilities = ["create", "update", "patch", "read", "delete", "list", "scan", "sudo"]
}

EOP
    }
  }

  request "mount-kv" {
    path      = "sys/mounts/secret"
    operation = "create"
    data = {
      type        = "kv-v2"
      description = "Himitsu Vault secrets."
    }
  }
}
