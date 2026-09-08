/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { helper as buildHelper } from '@ember/component/helper';

const MOUNTABLE_AUTH_METHODS = [
  {
    displayName: 'AppRole',
    value: 'approle',
    type: 'approle',
    category: 'generic',
  },
  {
    displayName: 'JWT',
    value: 'jwt',
    type: 'jwt',
    glyph: 'auth',
    category: 'generic',
  },
  {
    displayName: 'OIDC',
    value: 'oidc',
    type: 'oidc',
    glyph: 'auth',
    category: 'generic',
  },
  {
    displayName: 'Kubernetes',
    value: 'kubernetes',
    type: 'kubernetes',
    category: 'infra',
    glyph: 'kubernetes-color',
  },
  {
    displayName: 'TLS Certificates',
    value: 'cert',
    type: 'cert',
    category: 'generic',
  },
  {
    displayName: 'Username & Password',
    value: 'userpass',
    type: 'userpass',
    category: 'generic',
  },
  {
    displayName: 'AWS',
    value: 'auth-aws',
    type: 'auth-aws',
    glyph: 'auth',
    category: 'cloud',
  },
  {
    displayName: 'Azure',
    value: 'auth-azure',
    type: 'auth-azure',
    glyph: 'auth',
    category: 'cloud',
  },
  {
    displayName: 'GCP',
    value: 'auth-gcp',
    type: 'auth-gcp',
    glyph: 'auth',
    category: 'cloud',
  },
  {
    displayName: 'GitHub',
    value: 'auth-github',
    type: 'auth-github',
    glyph: 'auth',
    category: 'cloud',
  },
];

export function methods() {
  return MOUNTABLE_AUTH_METHODS.slice();
}

export default buildHelper(methods);
