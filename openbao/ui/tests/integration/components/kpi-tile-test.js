/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | kpi-tile', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the eyebrow, value and sub text', async function (assert) {
    await render(hbs`
      <KpiTile
        @eyebrow="Cluster health"
        @value="3 / 3 nodes"
        @sub="All servers reachable"
        @status="success"
        @statusLabel="Healthy"
      />
    `);

    assert.dom('[data-test-component="kpi-tile"]').exists('renders the tile');
    assert.dom('[data-test-kpi-eyebrow]').hasText('Cluster health');
    assert.dom('[data-test-kpi-value]').hasText('3 / 3 nodes');
    assert.dom('[data-test-kpi-sub]').hasText('All servers reachable');
    assert.dom('[data-test-kpi-status]').hasText('Healthy');
  });

  test('it applies a status-tinted class', async function (assert) {
    await render(hbs`
      <KpiTile @eyebrow="Seal" @status="warn" @statusLabel="Sealed" @value="Sealed" />
    `);
    assert.dom('[data-test-component="kpi-tile"]').hasClass('is-warn', 'top border tinted to warn state');
  });

  test('it shows the shimmer placeholder when loading', async function (assert) {
    await render(hbs`
      <KpiTile @eyebrow="Loading" @value="—" @loading={{true}} />
    `);
    assert.dom('.kpi-tile-loading').exists('loading class is applied');
  });

  test('it renders the meta row when provided', async function (assert) {
    await render(hbs`
      <KpiTile
        @eyebrow="Replication"
        @value="Primary"
        @meta="Source · sys/replication/status"
      />
    `);
    assert.dom('[data-test-kpi-meta]').hasText('Source · sys/replication/status');
  });

  test('it falls back to muted status when status arg is invalid', async function (assert) {
    await render(hbs`
      <KpiTile @eyebrow="Test" @value="x" @status="not-a-real-status" @statusLabel="Test" />
    `);
    assert.dom('[data-test-component="kpi-tile"]').hasClass('is-muted', 'invalid status falls back to muted');
  });
});
