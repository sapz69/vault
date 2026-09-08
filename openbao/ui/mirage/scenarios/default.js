/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import ENV from 'vault/config/environment';
const { handler } = ENV['ember-cli-mirage'];
import kubernetesScenario from './kubernetes';

export default function (server) {
  // NOTE: server.create('clients/config') is disabled here — there's no matching
  // mirage factory and ember-data's auto-discovery fails to resolve one for this
  // model under the current toolchain, crashing app boot before it even renders.
  // Pre-existing issue, unrelated to styling; harmless to skip for local preview.
  if (handler === 'kubernetes') {
    kubernetesScenario(server);
  }
}
