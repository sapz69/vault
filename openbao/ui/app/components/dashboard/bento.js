/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { task, all } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

/**
 * @module Dashboard::Bento
 *
 * Data-loader for the dashboard bento layout.
 * Fetches cluster-wide summary data from the existing REST adapter
 * without introducing any new endpoints or contracts.
 *
 * Each loader is wrapped in its own task so partial failures don't
 * blank the screen — tiles degrade to "loading" / "unknown" states.
 */
export default class DashboardBentoComponent extends Component {
  @service store;
  @service namespace;
  @service version;

  @tracked loading = true;
  @tracked lastLoadedAt = null;

  // raw + derived state for each tile. derived values default to "loading"
  // until the relevant task resolves.
  @tracked healthState = null;
  @tracked healthError = null;
  @tracked sealState = null;
  @tracked sealError = null;
  @tracked replicationState = null;
  @tracked replicationError = null;
  @tracked raftState = null;
  @tracked raftError = null;
  @tracked countsState = null;
  @tracked countsError = null;
  @tracked namespacesState = null;
  @tracked namespacesError = null;
  @tracked versionState = null;

  constructor() {
    super(...arguments);
    this.refreshAll();
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.refreshAllTask.cancelAll();
  }

  get hasAnyData() {
    return Boolean(this.lastLoadedAt);
  }

  refreshAll() {
    return this.refreshAllTask.perform();
  }

  @task *refreshAllTask() {
    this.loading = true;
    try {
      yield all([
        this.loadHealthTask.perform().catch(() => undefined),
        this.loadSealTask.perform().catch(() => undefined),
        this.loadReplicationTask.perform().catch(() => undefined),
        this.loadRaftTask.perform().catch(() => undefined),
        this.loadCountsTask.perform().catch(() => undefined),
        this.loadNamespacesTask.perform().catch(() => undefined),
        this.loadVersionTask.perform().catch(() => undefined),
      ]);
      this.lastLoadedAt = new Date();
    } finally {
      this.loading = false;
    }
  }

  // ---------- individual loaders ----------

  @task *loadHealthTask() {
    const adapter = this.store.adapterFor('application');
    try {
      const resp = yield adapter.ajax('/v1/sys/health', 'GET');
      this.healthState = resp;
      this.healthError = null;
    } catch (err) {
      this.healthError = err;
    }
  }

  @task *loadSealTask() {
    const adapter = this.store.adapterFor('application');
    try {
      const resp = yield adapter.ajax('/v1/sys/seal-status', 'GET');
      this.sealState = resp;
      this.sealError = null;
    } catch (err) {
      this.sealError = err;
    }
  }

  @task *loadReplicationTask() {
    const adapter = this.store.adapterFor('application');
    try {
      const resp = yield adapter.ajax('/v1/sys/replication/status', 'GET');
      this.replicationState = resp;
      this.replicationError = null;
    } catch (err) {
      // 404 on this endpoint means replication is not enabled — not an error
      const status = err && (err.httpStatus || err.status);
      if (status === 404) {
        this.replicationState = { enabled: false };
      } else {
        this.replicationError = err;
      }
    }
  }

  @task *loadRaftTask() {
    try {
      const servers = yield this.store.query('server', {});
      this.raftState = servers && servers.toArray ? servers.toArray() : A(servers || []);
      this.raftError = null;
    } catch (err) {
      this.raftError = err;
      this.raftState = A([]);
    }
  }

  @task *loadCountsTask() {
    const adapter = this.store.adapterFor('application');
    const results = { auth: null, mounts: null, audit: null, policies: null };
    const safeFetch = (path) =>
      adapter
        .ajax(path, 'GET')
        .then((resp) => resp)
        .catch(() => null);

    try {
      const [auth, mounts, audit, policies] = yield Promise.all([
        safeFetch('/v1/sys/auth'),
        safeFetch('/v1/sys/mounts'),
        safeFetch('/v1/sys/audit'),
        safeFetch('/v1/sys/policies/acl'),
      ]);
      results.auth = auth;
      results.mounts = mounts;
      results.audit = audit;
      results.policies = policies;
      this.countsState = results;
      this.countsError = null;
    } catch (err) {
      this.countsError = err;
    }
  }

  @task *loadNamespacesTask() {
    const adapter = this.store.adapterFor('application');
    try {
      const resp = yield adapter.ajax('/v1/sys/namespaces', 'GET');
      this.namespacesState = resp;
      this.namespacesError = null;
    } catch (err) {
      this.namespacesError = err;
      this.namespacesState = { keys: [] };
    }
  }

  @task *loadVersionTask() {
    try {
      yield this.version.fetchVersion();
      this.versionState = this.version.version;
    } catch {
      this.versionState = null;
    }
  }

  // ---------- derived tile data ----------

  // ─── Health ───
  get isLoadingHealth() {
    return this.loadHealthTask.isRunning;
  }
  get healthStatusLabel() {
    if (this.isLoadingHealth) return 'muted';
    const h = this.healthState;
    if (!h) return 'muted';
    if (h.initialized === false) return 'warn';
    if (h.sealed === true) return 'warn';
    if (h.standby === true) return 'muted';
    if (h.performance_standby === true) return 'muted';
    if (h.replication_primary_mode === 'primary') return 'success';
    if (h.replication_secondary_mode) return 'success';
    if (h.initialized === true && h.sealed === false) return 'success';
    return 'muted';
  }
  get healthStatusText() {
    if (this.isLoadingHealth) return 'Checking…';
    const h = this.healthState;
    if (!h) return 'Unknown';
    if (h.sealed === true) return 'Sealed';
    if (h.standby === true) return 'Standby';
    if (h.performance_standby === true) return 'Perf standby';
    if (h.replication_primary_mode === 'primary') return 'Primary';
    if (h.replication_secondary_mode) return 'Secondary';
    if (h.initialized === false) return 'Uninitialized';
    return 'Healthy';
  }
  get healthValue() {
    const h = this.healthState;
    if (this.isLoadingHealth) return '—';
    if (!h) return '—';
    return h.cluster_name || 'cluster';
  }
  get healthSub() {
    const h = this.healthState;
    if (!h) return 'Awaiting first response…';
    if (h.initialized === false) return 'Cluster has not been initialized yet.';
    if (h.sealed === true) return 'Cluster is sealed — authentication is unavailable.';
    if (h.standby === true) return 'Node is a standby; failover has not promoted it.';
    return 'Node is initialized, unsealed, and reachable.';
  }

  // ─── Seal ───
  get isLoadingSeal() {
    return this.loadSealTask.isRunning;
  }
  get sealStatusLabel() {
    if (this.isLoadingSeal) return 'muted';
    const s = this.sealState;
    if (!s) return 'muted';
    return s.sealed ? 'warn' : 'success';
  }
  get sealStatusText() {
    if (this.isLoadingSeal) return 'Checking…';
    const s = this.sealState;
    if (!s) return 'Unknown';
    return s.sealed ? 'Sealed' : 'Unsealed';
  }
  get sealValue() {
    const s = this.sealState;
    if (this.isLoadingSeal) return '—';
    if (!s) return '—';
    return s.sealed ? 'Sealed' : 'Unsealed';
  }
  get sealSub() {
    const s = this.sealState;
    if (!s) return 'Awaiting first response…';
    if (s.sealed) {
      const t = s.progress || 0;
      const total = s.total || 0;
      if (total) return `${t} of ${total} shares provided`;
      return 'Awaiting unseal shares.';
    }
    return 'All unseal shares have been provided.';
  }
  get sealMeta() {
    const s = this.sealState;
    if (!s) return 'Source · sys/seal-status';
    if (s.sealed && s.threshold) {
      return `Threshold · ${s.threshold} shares required`;
    }
    return 'Source · sys/seal-status';
  }

  // ─── Replication ───
  get isLoadingReplication() {
    return this.loadReplicationTask.isRunning;
  }
  get replicationStatusLabel() {
    if (this.isLoadingReplication) return 'muted';
    const r = this.replicationState;
    if (!r) return 'muted';
    if (r.enabled === false) return 'muted';
    if (r.primary) return 'success';
    if (r.secondary) return 'success';
    return 'muted';
  }
  get replicationStatusText() {
    if (this.isLoadingReplication) return 'Checking…';
    const r = this.replicationState;
    if (!r) return 'Unknown';
    if (r.enabled === false) return 'Disabled';
    if (r.primary) return 'Primary';
    if (r.secondary) return 'Secondary';
    return 'Unknown';
  }
  get replicationValue() {
    if (this.isLoadingReplication) return '—';
    const r = this.replicationState;
    if (!r) return '—';
    if (r.enabled === false) return 'Standalone';
    return r.mode || (r.primary ? 'Primary' : 'Secondary');
  }
  get replicationSub() {
    const r = this.replicationState;
    if (!r) return 'Awaiting first response…';
    if (r.enabled === false) return 'Replication is not enabled on this cluster.';
    if (r.primary) return 'Cluster is acting as a replication primary.';
    if (r.secondary) return 'Cluster is connected as a replication secondary.';
    return 'Replication status could not be determined.';
  }

  // ─── Counts ───
  get authMethodsValue() {
    const a = this.countsState && this.countsState.auth;
    if (!a) return '—';
    const keys = Object.keys(a || {}).filter((k) => !k.endsWith('/'));
    return String(keys.length);
  }
  get authMethodsMeta() {
    const a = this.countsState && this.countsState.auth;
    if (!a) return 'Source · sys/auth';
    const keys = Object.keys(a || {}).filter((k) => !k.endsWith('/'));
    return keys.length === 0 ? 'No auth methods mounted' : 'Source · sys/auth';
  }
  get secretEnginesValue() {
    const m = this.countsState && this.countsState.mounts;
    if (!m) return '—';
    const keys = Object.keys(m || {}).filter((k) => !k.endsWith('/'));
    return String(keys.length);
  }
  get secretEnginesMeta() {
    const m = this.countsState && this.countsState.mounts;
    if (!m) return 'Source · sys/mounts';
    const keys = Object.keys(m || {}).filter((k) => !k.endsWith('/'));
    return keys.length === 0 ? 'No secret engines mounted' : 'Source · sys/mounts';
  }
  get auditDevicesValue() {
    const a = this.countsState && this.countsState.audit;
    if (!a) return '—';
    if (Array.isArray(a)) return String(a.length);
    if (typeof a === 'object') return String(Object.keys(a).length);
    return '—';
  }
  get auditStatusLabel() {
    const a = this.countsState && this.countsState.audit;
    if (!a) return 'muted';
    return 'muted';
  }
  get auditStatusText() {
    const a = this.countsState && this.countsState.audit;
    if (!a) return 'Configured';
    return 'Configured';
  }
  get policiesValue() {
    const p = this.countsState && this.countsState.policies;
    if (!p) return '—';
    const keys = Array.isArray(p.keys) ? p.keys : [];
    return String(keys.length);
  }

  // ─── Raft panel ───
  get raftPeers() {
    const arr = this.raftState;
    if (!arr || !arr.length) return [];
    return arr.map((peer) => {
      const address = peer.address || peer.id || 'unknown';
      const isLeader = peer.leader === true;
      const isVoter = peer.voter === true;
      const isNonVoter = peer.non_voter === true;
      let stateLabel = 'peer';
      if (isLeader) stateLabel = 'leader';
      else if (isNonVoter) stateLabel = 'non-voter';
      else if (isVoter) stateLabel = 'voter';
      return { address, stateLabel };
    });
  }
  get raftSummary() {
    const peers = this.raftPeers;
    if (!peers.length) return 'No peers reported';
    const leaders = peers.filter((p) => p.stateLabel === 'leader').length;
    return `${peers.length} peer${peers.length === 1 ? '' : 's'}${leaders ? ` · ${leaders} leader` : ''}`;
  }

  // ─── Namespaces panel ───
  get namespaceChildren() {
    const resp = this.namespacesState;
    if (!resp) return [];
    const keys = Array.isArray(resp.keys) ? resp.keys : [];
    return keys.map((path) => ({
      path,
      id: path.split('/').filter(Boolean).pop() || path,
    }));
  }
  get namespacesSummary() {
    const list = this.namespaceChildren;
    if (!list.length) return 'No child namespaces';
    return `${list.length} child namespace${list.length === 1 ? '' : 's'}`;
  }
  get namespaceLabel() {
    return this.namespace && this.namespace.path ? this.namespace.path : 'root';
  }

  // ─── Server / version panel ───
  get versionDisplay() {
    return this.versionState || this.version.version || '—';
  }
  get clusterId() {
    const h = this.healthState;
    if (!h) return '—';
    return h.cluster_id || '—';
  }

  // ─── Quick links ───
  get quickLinks() {
    return [
      { id: 'secrets', route: 'vault.cluster.secrets', label: 'Secrets engines', icon: 'key' },
      { id: 'access', route: 'vault.cluster.access', label: 'Access management', icon: 'folder-users' },
      { id: 'policies', route: 'vault.cluster.policies', label: 'Policies', icon: 'file-text' },
      { id: 'tools', route: 'vault.cluster.tools', label: 'Tools', icon: 'build' },
    ];
  }
}
