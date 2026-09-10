/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Service from '@ember/service';
import { resolve, reject } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

/*
  These tests exist because every defect the dashboard shipped with lived in
  bento.js and none of them were caught: an inverted mount filter that counted
  the response envelope instead of the mounts, a LIST endpoint fetched with GET,
  and a <LinkTo> to a route with a required dynamic segment that put Ember into
  an unrecoverable render state.

  The fixtures below are shaped like real OpenBao replies - the mounts sit at the
  top level *alongside* request_id/lease_id/data/wrap_info. That envelope is
  exactly what the inverted filter was counting, so a trimmed fixture would have
  passed while the UI showed the wrong number.
*/
const AUTH_RESPONSE = {
  'token/': { accessor: 'auth_token_1' },
  'userpass/': { accessor: 'auth_userpass_1' },
  request_id: 'abc',
  lease_id: '',
  renewable: false,
  lease_duration: 0,
  data: {},
  wrap_info: null,
  warnings: null,
  auth: null,
};

const MOUNTS_RESPONSE = {
  'identity/': { accessor: 'identity_1' },
  'secret/': { accessor: 'kv_1' },
  'sys/': { accessor: 'system_1' },
  'cubbyhole/': { accessor: 'cubbyhole_1' },
  request_id: 'abc',
  lease_id: '',
  renewable: false,
  lease_duration: 0,
  data: {},
  wrap_info: null,
  warnings: null,
  auth: null,
};

// sys/audit with nothing mounted: envelope only, zero keys ending in '/'.
const AUDIT_EMPTY = {
  request_id: 'abc',
  lease_id: '',
  renewable: false,
  lease_duration: 0,
  data: {},
  wrap_info: null,
  warnings: null,
  auth: null,
};

// A LIST response nests the names under data.keys, not at the top level.
const POLICIES_RESPONSE = {
  request_id: 'abc',
  data: { keys: ['admin', 'default', 'root'] },
};

function buildStore(overrides = {}) {
  const responses = {
    '/v1/sys/health': {
      initialized: true,
      sealed: false,
      standby: false,
      cluster_name: 'test-cluster',
    },
    '/v1/sys/seal-status': { type: 'static', initialized: true, sealed: false, t: 0, n: 0 },
    '/v1/sys/auth': AUTH_RESPONSE,
    '/v1/sys/mounts': MOUNTS_RESPONSE,
    '/v1/sys/audit': AUDIT_EMPTY,
    '/v1/sys/policies/acl?list=true': POLICIES_RESPONSE,
    ...overrides,
  };
  const adapter = {
    ajax(path) {
      if (Object.prototype.hasOwnProperty.call(responses, path)) {
        const value = responses[path];
        return value instanceof Error ? reject(value) : resolve(value);
      }
      // anything not stubbed behaves like an OpenBao 404 (e.g. an empty LIST)
      const err = new Error('not found');
      err.httpStatus = 404;
      return reject(err);
    },
  };
  return Service.extend({
    adapterFor() {
      return adapter;
    },
    query() {
      return resolve([]);
    },
  });
}

const versionStub = Service.extend({
  version: '2.0.0-test',
  fetchVersion() {
    return resolve('2.0.0-test');
  },
});

const namespaceStub = Service.extend({ path: '' });

module('Integration | Component | Dashboard::Bento', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:version', versionStub);
    this.owner.register('service:namespace', namespaceStub);
  });

  test('it counts mounts, not the response envelope', async function (assert) {
    this.owner.register('service:store', buildStore());
    await render(hbs`<Dashboard::Bento />`);

    // The bug this guards: `!k.endsWith('/')` counted request_id/lease_id/data/
    // wrap_info/warnings/auth and reported 8 for each of these tiles.
    const values = [...this.element.querySelectorAll('[data-test-kpi-value]')].map((el) =>
      el.textContent.trim()
    );
    assert.true(values.includes('2'), 'auth methods reports 2 (token/, userpass/), not 8');
    assert.true(values.includes('4'), 'secret engines reports 4, not 8');
    assert.true(values.includes('0'), 'audit devices reports 0 when none are mounted, not 8');
  });

  test('it reads policy names from the nested LIST payload', async function (assert) {
    this.owner.register('service:store', buildStore());
    await render(hbs`<Dashboard::Bento />`);

    const values = [...this.element.querySelectorAll('[data-test-kpi-value]')].map((el) =>
      el.textContent.trim()
    );
    assert.true(values.includes('3'), 'ACL policies reads data.keys and reports 3');
  });

  test('every quick link renders, including one whose route needs a dynamic segment', async function (assert) {
    this.owner.register('service:store', buildStore());
    await render(hbs`<Dashboard::Bento />`);

    // vault.cluster.policies is declared as /policies/:type. A LinkTo without a
    // model throws while generating the href, and Ember then refuses every later
    // re-render - which froze all seven tiles on their placeholders.
    assert
      .dom('[data-test-quicklink]')
      .exists({ count: 4 }, 'all four quick links render; none throws on href generation');
    assert.dom('[data-test-quicklink="policies"]').exists('the policies link is present');
  });

  test('a failing counts endpoint is surfaced, not silently blanked', async function (assert) {
    const err = new Error('method not allowed');
    err.httpStatus = 405;
    this.owner.register('service:store', buildStore({ '/v1/sys/auth': err }));
    await render(hbs`<Dashboard::Bento />`);

    // Previously `.catch(() => null)` made a 405 indistinguishable from "none".
    assert.ok(
      this.element.textContent.includes('sys/auth unavailable'),
      'the failure reason is shown rather than a bare em-dash'
    );
  });

  test('it renders health and seal state from the live responses', async function (assert) {
    this.owner.register('service:store', buildStore());
    await render(hbs`<Dashboard::Bento />`);

    const text = this.element.textContent;
    assert.ok(text.includes('Cluster health'), 'health tile renders');
    assert.ok(text.includes('Seal state'), 'seal tile renders');
    assert.notOk(
      text.includes('Awaiting first response'),
      'tiles resolve rather than staying stuck on their loading placeholder'
    );
  });

  test('an absent Enterprise endpoint degrades instead of erroring', async function (assert) {
    // sys/replication/status is Enterprise-only and 404s on OpenBao OSS.
    this.owner.register('service:store', buildStore());
    await render(hbs`<Dashboard::Bento />`);

    assert.ok(
      this.element.textContent.includes('Replication'),
      'the replication tile still renders on a 404'
    );
  });
});
