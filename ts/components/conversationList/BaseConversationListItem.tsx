// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode, FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { isBoolean, isNumber } from 'lodash';

import { Avatar, AvatarSize } from '../Avatar';
import type { BadgeType } from '../../badges/types';
import { isConversationUnread } from '../../util/isConversationUnread';
import { cleanId } from '../_util';
import type { LocalizerType, ThemeType } from '../../types/Util';
import type { ConversationType } from '../../state/ducks/conversations';
import { Spinner } from '../Spinner';
import { Time } from '../Time';
import { formatDateTimeShort } from '../../util/timestamp';
import * as durations from '../../util/durations';
import { UUID } from '../../types/UUID';

const BASE_CLASS_NAME =
  'module-conversation-list__item--contact-or-conversation';
const AVATAR_CONTAINER_CLASS_NAME = `${BASE_CLASS_NAME}__avatar-container`;
const CONTENT_CLASS_NAME = `${BASE_CLASS_NAME}__content`;
const HEADER_CLASS_NAME = `${CONTENT_CLASS_NAME}__header`;
export const HEADER_NAME_CLASS_NAME = `${HEADER_CLASS_NAME}__name`;
export const HEADER_CONTACT_NAME_CLASS_NAME = `${HEADER_NAME_CLASS_NAME}__contact-name`;
export const DATE_CLASS_NAME = `${HEADER_CLASS_NAME}__date`;
const MESSAGE_CLASS_NAME = `${CONTENT_CLASS_NAME}__message`;
export const MESSAGE_TEXT_CLASS_NAME = `${MESSAGE_CLASS_NAME}__text`;
const CHECKBOX_CONTAINER_CLASS_NAME = `${BASE_CLASS_NAME}__checkbox--container`;
const CHECKBOX_CLASS_NAME = `${BASE_CLASS_NAME}__checkbox`;
export const SPINNER_CLASS_NAME = `${BASE_CLASS_NAME}__spinner`;

type PropsType = {
  checked?: boolean;
  conversationType: 'group' | 'direct';
  disabled?: boolean;
  headerDate?: number;
  headerName: ReactNode;
  id?: string;
  i18n: LocalizerType;
  isNoteToSelf?: boolean;
  isSelected: boolean;
  isUsernameSearchResult?: boolean;
  markedUnread?: boolean;
  messageId?: string;
  messageStatusIcon?: ReactNode;
  messageText?: ReactNode;
  messageTextIsAlwaysFullSize?: boolean;
  onClick?: () => void;
  shouldShowSpinner?: boolean;
  unreadCount?: number;
  avatarSize?: AvatarSize;
  testId?: string;
} & Pick<
  ConversationType,
  | 'acceptedMessageRequest'
  | 'avatarPath'
  | 'color'
  | 'groupId'
  | 'isMe'
  | 'markedUnread'
  | 'phoneNumber'
  | 'profileName'
  | 'sharedGroupNames'
  | 'title'
  | 'unblurredAvatarPath'
  | 'uuid'
> &
  (
    | { badge?: undefined; theme?: ThemeType }
    | { badge: BadgeType; theme: ThemeType }
  );

export const BaseConversationListItem: FunctionComponent<PropsType> =
  React.memo(function BaseConversationListItem(props) {
    const {
      acceptedMessageRequest,
      avatarPath,
      avatarSize,
      checked,
      color,
      conversationType,
      disabled,
      groupId,
      headerDate,
      headerName,
      i18n,
      id,
      isMe,
      isNoteToSelf,
      isUsernameSearchResult,
      isSelected,
      markedUnread,
      messageStatusIcon,
      messageText,
      messageTextIsAlwaysFullSize,
      onClick,
      phoneNumber,
      profileName,
      sharedGroupNames,
      shouldShowSpinner,
      testId: overrideTestId,
      title,
      unblurredAvatarPath,
      unreadCount,
      uuid,
    } = props;

    const identifier = id ? cleanId(id) : undefined;
    const htmlId = useMemo(() => UUID.generate().toString(), []);
    const testId = overrideTestId || groupId || uuid;
    const isUnread = isConversationUnread({ markedUnread, unreadCount });

    const isAvatarNoteToSelf = isBoolean(isNoteToSelf)
      ? isNoteToSelf
      : Boolean(isMe);

    const isCheckbox = isBoolean(checked);

    let actionNode: ReactNode;
    if (shouldShowSpinner) {
      actionNode = (
        <Spinner
          size="20px"
          svgSize="small"
          moduleClassName={SPINNER_CLASS_NAME}
          direction="on-progress-dialog"
        />
      );
    } else if (isCheckbox) {
      let ariaLabel: string;
      if (disabled) {
        ariaLabel = i18n('icu:cannotSelectContact', {
          name: title,
        });
      } else if (checked) {
        ariaLabel = i18n('icu:deselectContact', {
          name: title,
        });
      } else {
        ariaLabel = i18n('icu:selectContact', {
          name: title,
        });
      }
      actionNode = (
        <div className={CHECKBOX_CONTAINER_CLASS_NAME}>
          <input
            aria-label={ariaLabel}
            checked={checked}
            className={CHECKBOX_CLASS_NAME}
            disabled={disabled}
            id={htmlId}
            onChange={onClick}
            onKeyDown={event => {
              if (onClick && !disabled && event.key === 'Enter') {
                onClick();
              }
            }}
            type="checkbox"
          />
        </div>
      );
    }

    const contents = (
      <>
        <div className={AVATAR_CONTAINER_CLASS_NAME}>
          <Avatar
            acceptedMessageRequest={acceptedMessageRequest}
            avatarPath={avatarPath}
            color={color}
            conversationType={conversationType}
            noteToSelf={isAvatarNoteToSelf}
            searchResult={isUsernameSearchResult}
            i18n={i18n}
            isMe={isMe}
            phoneNumber={phoneNumber}
            profileName={profileName}
            title={title}
            sharedGroupNames={sharedGroupNames}
            size={avatarSize ?? AvatarSize.FORTY_EIGHT}
            unblurredAvatarPath={unblurredAvatarPath}
            // This is here to appease the type checker.
            {...(props.badge
              ? { badge: props.badge, theme: props.theme }
              : { badge: undefined })}
          />
          <UnreadIndicator count={unreadCount} isUnread={isUnread} />
        </div>
        <div
          className={classNames(
            CONTENT_CLASS_NAME,
            disabled && `${CONTENT_CLASS_NAME}--disabled`
          )}
        >
          <div className={HEADER_CLASS_NAME}>
            <div className={`${HEADER_CLASS_NAME}__name`}>{headerName}</div>
            <Timestamp timestamp={headerDate} i18n={i18n} />
          </div>
          {messageText || isUnread ? (
            <div className={MESSAGE_CLASS_NAME}>
              {Boolean(messageText) && (
                <div
                  dir="auto"
                  className={classNames(
                    MESSAGE_TEXT_CLASS_NAME,
                    messageTextIsAlwaysFullSize &&
                      `${MESSAGE_TEXT_CLASS_NAME}--always-full-size`
                  )}
                >
                  {messageText}
                </div>
              )}
              {messageStatusIcon}
              <UnreadIndicator count={unreadCount} isUnread={isUnread} />
            </div>
          ) : null}
        </div>
        {actionNode}
      </>
    );

    const commonClassNames = classNames(BASE_CLASS_NAME, {
      [`${BASE_CLASS_NAME}--is-selected`]: isSelected,
    });

    if (isCheckbox) {
      return (
        <label
          className={classNames(
            commonClassNames,
            `${BASE_CLASS_NAME}--is-checkbox`,
            { [`${BASE_CLASS_NAME}--is-checkbox--disabled`]: disabled }
          )}
          data-id={identifier}
          data-testid={testId}
          htmlFor={htmlId}
          // `onClick` is will double-fire if we're enabled. We want it to fire when we're
          //   disabled so we can show any "can't add contact" modals, etc. This won't
          //   work for keyboard users, though, because labels are not tabbable.
          {...(disabled ? { onClick } : {})}
        >
          {contents}
        </label>
      );
    }

    if (onClick) {
      return (
        <button
          aria-label={i18n('icu:BaseConversationListItem__aria-label', {
            title,
          })}
          className={classNames(
            commonClassNames,
            `${BASE_CLASS_NAME}--is-button`
          )}
          data-id={identifier}
          data-testid={testId}
          disabled={disabled}
          onClick={onClick}
          type="button"
        >
          {contents}
        </button>
      );
    }

    return (
      <div
        className={commonClassNames}
        data-id={identifier}
        data-testid={testId}
      >
        {contents}
      </div>
    );
  });

function Timestamp({
  i18n,
  timestamp,
}: Readonly<{ i18n: LocalizerType; timestamp?: number }>) {
  const getText = useCallback(
    () => (isNumber(timestamp) ? formatDateTimeShort(i18n, timestamp) : ''),
    [i18n, timestamp]
  );

  const [text, setText] = useState(getText());

  useEffect(() => {
    const update = () => setText(getText());
    update();
    const interval = setInterval(update, durations.MINUTE);
    return () => {
      clearInterval(interval);
    };
  }, [getText]);

  if (!isNumber(timestamp)) {
    return null;
  }

  return (
    <Time className={DATE_CLASS_NAME} timestamp={timestamp}>
      {text}
    </Time>
  );
}

function UnreadIndicator({
  count = 0,
  isUnread,
}: Readonly<{ count?: number; isUnread: boolean }>) {
  if (!isUnread) {
    return null;
  }

  return (
    <div className={classNames(`${BASE_CLASS_NAME}__unread-indicator`)}>
      {Boolean(count) && count}
    </div>
  );
}
