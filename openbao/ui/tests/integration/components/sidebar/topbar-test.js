/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | Sidebar::Topbar', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const currentCluster = this.owner.lookup('service:current-cluster');
    const namespace = this.owner.lookup('service:namespace');
    currentCluster.setCluster({ name: 'vault-prod' });
    namespace.setNamespace('admin/team-a');
  });

  test('it renders the cluster id and namespace path', async function (assert) {
    await render(hbs`<Sidebar::Topbar />`);
    assert.dom('[data-test-topbar-cluster]').exists('renders the cluster block');
    assert.dom('[data-test-topbar-cluster]').hasText('Cluster vault-prod');
    assert.dom('[data-test-topbar-namespace]').hasText('admin/team-a');
  });

  test('it links to the dashboard and to docs', async function (assert) {
    await render(hbs`<Sidebar::Topbar />`);
    assert
      .dom('[data-test-topbar-dashboard]')
      .exists('dashboard quicklink is rendered')
      .hasAttribute('href', /\/vault\/cluster\/dashboard/);
    assert.dom('[data-test-topbar-docs]').exists('docs link is rendered');
  });

  test('it falls back to "root" namespace when none is set', async function (assert) {
    const namespace = this.owner.lookup('service:namespace');
    namespace.setNamespace('');
    await render(hbs`<Sidebar::Topbar />`);
    assert.dom('[data-test-topbar-namespace]').hasText('root');
  });
});
