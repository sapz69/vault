/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | vault/cluster/dashboard', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.route = this.owner.lookup('route:vault/cluster/dashboard');
  });

  test('it exists and inherits ClusterBaseRoute semantics', function (assert) {
    assert.ok(this.route, 'route is registered');
    // beforeModel is inherited from ClusterBaseRoute
    assert.strictEqual(
      typeof this.route.beforeModel,
      'function',
      'beforeModel hook inherited from ClusterBaseRoute'
    );
    assert.strictEqual(
      typeof this.route.transitionToTargetRoute,
      'function',
      'transitionToTargetRoute helper inherited from ClusterBaseRoute'
    );
  });

  test('it does not define a model hook', function (assert) {
    // The Bento component loads its own data via ember-concurrency tasks.
    // No model() hook on this route keeps cluster-base redirects snappy
    // and avoids eager network traffic before the page is visible.
    assert.strictEqual(typeof this.route.model, 'undefined', 'no model() hook defined');
  });
});
