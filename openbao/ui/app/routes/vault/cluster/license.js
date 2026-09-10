/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

/**
 * `/vault/cluster/license` — renders the current license state via
 * `<LicenseInfo>`. The serializer (`app/serializers/license.js`) handles
 * translating the `sys/license/status` response into the shape expected by
 * `app/models/license.js`.
 */
export default Route.extend({
  store: service(),

  model() {
    return this.store.query('license', {}).catch(() => {
      // Fall back to a no-license shape so the page still renders something
      // useful (e.g. when the cluster is sealed or endpoint is unavailable).
      return { licenseId: 'no-license', features: [] };
    });
  },
});
