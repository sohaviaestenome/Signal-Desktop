// Copyright 2018 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactChild, ReactElement } from 'react';
import React from 'react';
import classNames from 'classnames';
import Measure from 'react-measure';

import type { LocalizerType } from '../../types/Util';
import type { DirectionType, MessageStatusType } from './Message';
import type { PushPanelForConversationActionType } from '../../state/ducks/conversations';
import { ExpireTimer } from './ExpireTimer';
import { MessageTimestamp } from './MessageTimestamp';
import { PanelType } from '../../types/Panels';
import { Spinner } from '../Spinner';

type PropsType = {
  deletedForEveryone?: boolean;
  direction: DirectionType;
  expirationLength?: number;
  expirationTimestamp?: number;
  hasText: boolean;
  i18n: LocalizerType;
  id: string;
  isEditedMessage?: boolean;
  isInline?: boolean;
  isShowingImage: boolean;
  isSticker?: boolean;
  isTapToViewExpired?: boolean;
  onWidthMeasured?: (width: number) => unknown;
  pushPanelForConversation: PushPanelForConversationActionType;
  showEditHistoryModal?: (id: string) => unknown;
  status?: MessageStatusType;
  textPending?: boolean;
  timestamp: number;
};

export function MessageMetadata({
  deletedForEveryone,
  direction,
  expirationLength,
  expirationTimestamp,
  hasText,
  i18n,
  id,
  isEditedMessage,
  isInline,
  isShowingImage,
  isSticker,
  isTapToViewExpired,
  onWidthMeasured,
  pushPanelForConversation,
  showEditHistoryModal,
  status,
  textPending,
  timestamp,
}: Readonly<PropsType>): ReactElement {
  const withImageNoCaption = Boolean(!isSticker && !hasText && isShowingImage);
  const metadataDirection = isSticker ? undefined : direction;

  let timestampNode: ReactChild;
  {
    const isError = status === 'error' && direction === 'outgoing';
    const isPartiallySent =
      status === 'partial-sent' && direction === 'outgoing';
    const isPaused = status === 'paused';

    if (isError || isPartiallySent || isPaused) {
      let statusInfo: React.ReactChild;
      if (isError) {
        statusInfo = deletedForEveryone
          ? i18n('icu:deleteFailed')
          : i18n('icu:sendFailed');
      } else if (isPaused) {
        statusInfo = i18n('icu:sendPaused');
      } else {
        statusInfo = (
          <button
            type="button"
            className="module-message__metadata__tapable"
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              event.preventDefault();

              pushPanelForConversation({
                type: PanelType.MessageDetails,
                args: { messageId: id },
              });
            }}
          >
            {deletedForEveryone
              ? i18n('icu:partiallyDeleted')
              : i18n('icu:partiallySent')}
          </button>
        );
      }

      timestampNode = (
        <span
          className={classNames({
            'module-message__metadata__date': true,
            'module-message__metadata__date--with-sticker': isSticker,
            'module-message__metadata__date--deleted-for-everyone':
              deletedForEveryone,
            [`module-message__metadata__date--${direction}`]: !isSticker,
            'module-message__metadata__date--with-image-no-caption':
              withImageNoCaption,
          })}
        >
          {statusInfo}
        </span>
      );
    } else {
      timestampNode = (
        <MessageTimestamp
          i18n={i18n}
          timestamp={timestamp}
          direction={metadataDirection}
          deletedForEveryone={deletedForEveryone}
          withImageNoCaption={withImageNoCaption}
          withSticker={isSticker}
          withTapToViewExpired={isTapToViewExpired}
          module="module-message__metadata__date"
        />
      );
    }
  }

  const className = classNames(
    'module-message__metadata',
    isInline && 'module-message__metadata--inline',
    withImageNoCaption && 'module-message__metadata--with-image-no-caption',
    deletedForEveryone && 'module-message__metadata--deleted-for-everyone'
  );
  const children = (
    <>
      {isEditedMessage && showEditHistoryModal && (
        <button
          className="module-message__metadata__edited"
          onClick={() => showEditHistoryModal(id)}
          type="button"
        >
          {i18n('icu:MessageMetadata__edited')}
        </button>
      )}
      {timestampNode}
      {expirationLength ? (
        <ExpireTimer
          direction={metadataDirection}
          deletedForEveryone={deletedForEveryone}
          expirationLength={expirationLength}
          expirationTimestamp={expirationTimestamp}
          withImageNoCaption={withImageNoCaption}
          withSticker={isSticker}
          withTapToViewExpired={isTapToViewExpired}
        />
      ) : null}
      {textPending ? (
        <div className="module-message__metadata__spinner-container">
          <Spinner svgSize="small" size="14px" direction={direction} />
        </div>
      ) : null}
      {(!deletedForEveryone || status === 'sending') &&
      !textPending &&
      direction === 'outgoing' &&
      status !== 'error' &&
      status !== 'partial-sent' ? (
        <div
          className={classNames(
            'module-message__metadata__status-icon',
            `module-message__metadata__status-icon--${status}`,
            isSticker
              ? 'module-message__metadata__status-icon--with-sticker'
              : null,
            withImageNoCaption
              ? 'module-message__metadata__status-icon--with-image-no-caption'
              : null,
            deletedForEveryone
              ? 'module-message__metadata__status-icon--deleted-for-everyone'
              : null,
            isTapToViewExpired
              ? 'module-message__metadata__status-icon--with-tap-to-view-expired'
              : null
          )}
        />
      ) : null}
    </>
  );

  if (onWidthMeasured) {
    return (
      <Measure
        bounds
        onResize={({ bounds }) => {
          onWidthMeasured(bounds?.width || 0);
        }}
      >
        {({ measureRef }) => (
          <div className={className} ref={measureRef}>
            {children}
          </div>
        )}
      </Measure>
    );
  }

  return <div className={className}>{children}</div>;
}
