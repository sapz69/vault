/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import ClusterBaseRoute from '../cluster-base';

/**
 * Dashboard route — the post-login landing page for an authed cluster.
 *
 * No `model()` hook is defined on purpose: the Dashboard::Bento component
 * loads its own data via ember-concurrency tasks against the existing
 * REST adapter. Returning a model here would trigger network traffic
 * before the page is even visible, and would not improve UX.
 *
 * The ClusterBaseRoute.beforeModel hook handles auth/unseal/init redirects.
 */
export default ClusterBaseRoute.extend({});
