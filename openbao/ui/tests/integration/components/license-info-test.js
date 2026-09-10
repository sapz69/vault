/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | LicenseInfo', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the licensed state with id, dates, and features', async function (assert) {
    await render(hbs`<LicenseInfo
      @startTime="2024-01-01T00:00:00Z"
      @expirationTime="2025-01-01T00:00:00Z"
      @licenseId="abc-123"
      @features={{array "HSM" "Performance Replication"}}
      @autoloaded={{true}}
      @performanceStandbyCount={{3}}
    />`);
    assert.dom('[data-test-component="license-info"]').exists();
    assert.dom('[data-test-license-id]').hasText('abc-123');
    assert.dom('.license-info-feature').exists({ count: 2 }, 'renders one badge per feature');
    assert.dom('.license-info-status--success').exists('shows the success status pill');
  });

  test('it renders the no-license empty state when licenseId is missing', async function (assert) {
    await render(hbs`<LicenseInfo @licenseId="no-license" />`);
    assert.dom('[data-test-component="license-info"]').exists();
    assert.dom('[data-test-empty-state-title]').hasText('No enterprise license installed');
  });

  test('it renders the no-license empty state when licenseId is empty', async function (assert) {
    await render(hbs`<LicenseInfo @licenseId="" />`);
    assert.dom('[data-test-empty-state-title]').exists();
  });
});
