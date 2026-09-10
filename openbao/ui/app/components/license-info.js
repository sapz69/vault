/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

/**
 * `<LicenseInfo>` renders the current cluster license state.
 *
 * The data shape is dictated by `app/models/license.js` and its serializer
 * (`app/serializers/license.js`). The component is pure presentational —
 * it does not fetch, mutate, or talk to the backend.
 *
 * Args (all optional — missing fields fall back to safe placeholders):
 *   @startTime               string  ISO timestamp when license starts
 *   @expirationTime          string  ISO timestamp when license expires
 *   @licenseId               string  license identifier (defaults to "no-license")
 *   @features                array   string list of enabled feature flags
 *   @autoloaded              boolean whether license was auto-loaded
 *   @performanceStandbyCount number  licensed perf standby count
 */
export default class LicenseInfoComponent extends Component {
  @tracked _copied = false;

  get hasLicense() {
    const id = this.args.licenseId;
    return id && id !== 'no-license';
  }

  get statusLabel() {
    return this.hasLicense ? 'Licensed' : 'Community (no enterprise license)';
  }

  get statusKind() {
    return this.hasLicense ? 'success' : 'neutral';
  }

  get formattedExpiration() {
    const t = this.args.expirationTime;
    if (!t) return '—';
    try {
      return new Date(t).toLocaleString();
    } catch {
      return t;
    }
  }

  get formattedStart() {
    const t = this.args.startTime;
    if (!t) return '—';
    try {
      return new Date(t).toLocaleString();
    } catch {
      return t;
    }
  }

  get features() {
    return Array.isArray(this.args.features) ? this.args.features : [];
  }

  get perfStandbyLabel() {
    const n = this.args.performanceStandbyCount;
    return typeof n === 'number' ? String(n) : '—';
  }

  get autoloadedLabel() {
    return this.args.autoloaded ? 'Yes' : 'No';
  }

  @action
  copyLicenseId() {
    const id = this.args.licenseId;
    if (!id || !navigator?.clipboard) return;
    navigator.clipboard.writeText(id).then(() => {
      this._copied = true;
      setTimeout(() => (this._copied = false), 1500);
    });
  }
}
