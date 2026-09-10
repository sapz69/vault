/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import Component from '@glimmer/component';

/**
 * @module KpiTile
 *
 * A compact summary card used inside the dashboard bento layout.
 * Renders an eyebrow label, optional status pill, a primary value,
 * sub line and optional meta block.
 *
 * @example
 * ```hbs
 * <KpiTile
 *   @eyebrow="Cluster health"
 *   @status="success"
 *   @statusLabel="Healthy"
 *   @value="3 / 3 nodes"
 *   @sub="All servers reachable"
 *   @meta="Last check · 2s ago"
 *   @loading={{false}}
 * />
 * ```
 *
 * @param eyebrow=null {String}   Short uppercase label above the value.
 * @param status=null {String}    One of "success" | "warn" | "danger" | "muted".
 *                                Tints the top border + status pill.
 * @param statusLabel=null {String} Text shown inside the status pill.
 * @param value=null {String}     The headline metric (string so callers can format).
 * @param sub=null {String}       Single-line subtitle below the value.
 * @param meta=null {String}      Small caption rendered in a separated meta row.
 * @param loading=false {Boolean} When true, applies a shimmer placeholder.
 */

export default class KpiTileComponent extends Component {
  get status() {
    const s = this.args.status;
    return s && ['success', 'warn', 'danger', 'muted'].includes(s) ? s : null;
  }

  get statusClass() {
    return this.status ? `is-${this.status}` : 'is-muted';
  }

  get tileClass() {
    const classes = ['kpi-tile', `is-${this.status || 'muted'}`];
    if (this.args.loading) classes.push('kpi-tile-loading');
    return classes.join(' ');
  }

  get hasStatus() {
    return Boolean(this.status && this.args.statusLabel);
  }

  get hasMeta() {
    return Boolean(this.args.meta) || Boolean(this.args.metaBlocks?.length);
  }
}
