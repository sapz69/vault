/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Route from '@ember/routing/route';

export default Route.extend({
  beforeModel: function (transition) {
    if (transition.targetName === this.routeName) {
      // `replaceWith` already supersedes the in-flight transition. Calling
      // transition.abort() first left the router holding a half-torn-down
      // handler, so /vault/settings rendered an almost empty shell instead of
      // redirecting, and any later LinkTo href generation threw
      // "Cannot read properties of undefined (reading 'shouldSupersede')" -
      // which is what broke the namespace picker on this screen.
      return this.replaceWith('vault.cluster.settings.mount-secret-backend');
    }
  },
});
