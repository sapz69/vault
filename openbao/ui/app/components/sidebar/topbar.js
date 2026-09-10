/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

/**
 * @module Sidebar::Topbar
 *
 * Sticky header rendered above the main content. Surfaces the cluster
 * context (name + namespace) and a couple of out-of-app quick links.
 * Intentionally lightweight — does NOT fetch data. Health / replication
 * state is owned by the dashboard bento so we don't duplicate requests.
 *
 * Layout:
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  [vault-logo] cluster-name             [help] [dashboard]  │
 *   │                 namespace-path                             │
 *   └────────────────────────────────────────────────────────────┘
 */
export default class SidebarTopbarComponent extends Component {
  @service currentCluster;
  @service namespace;

  get clusterName() {
    return this.currentCluster.cluster?.name || 'cluster';
  }

  get hasCluster() {
    return Boolean(this.currentCluster.cluster?.name);
  }

  get clusterDisplay() {
    // Vault/Himitsu Vault clusters are addressed by URL; the route param is the
    // canonical id. Fall back to a friendly placeholder if it's missing.
    return this.clusterName;
  }

  get namespaceDisplay() {
    const path = this.namespace.path;
    return path && path.length ? path : 'root';
  }
}
