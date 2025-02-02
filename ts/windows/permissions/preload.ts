// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React from 'react';
import ReactDOM from 'react-dom';
import { contextBridge } from 'electron';

import { SignalContext } from '../context';

import { createSetting } from '../../util/preload';
import { PermissionsPopup } from '../../components/PermissionsPopup';

const mediaCameraPermissions = createSetting('mediaCameraPermissions', {
  getter: false,
});
const mediaPermissions = createSetting('mediaPermissions', {
  getter: false,
});

contextBridge.exposeInMainWorld(
  'nativeThemeListener',
  window.SignalContext.nativeThemeListener
);

contextBridge.exposeInMainWorld('SignalContext', {
  ...SignalContext,
  renderWindow: () => {
    const params = new URLSearchParams(document.location.search);
    const forCalling = params.get('forCalling') === 'true';
    const forCamera = params.get('forCamera') === 'true';

    let message;
    if (forCalling) {
      if (forCamera) {
        message = SignalContext.i18n('icu:videoCallingPermissionNeeded');
      } else {
        message = SignalContext.i18n('icu:audioCallingPermissionNeeded');
      }
    } else {
      message = SignalContext.i18n('icu:audioPermissionNeeded');
    }

    function onClose() {
      void SignalContext.executeMenuRole('close');
    }

    ReactDOM.render(
      React.createElement(PermissionsPopup, {
        i18n: SignalContext.i18n,
        message,
        onAccept: () => {
          if (!forCamera) {
            void mediaPermissions.setValue(true);
          } else {
            void mediaCameraPermissions.setValue(true);
          }
          onClose();
        },
        onClose,
      }),
      document.getElementById('app')
    );
  },
});
