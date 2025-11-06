import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TaggedComment, Summary, SummaryOption, MEME } from './types';

export type Props = {
  onRefresh?: () => void;
  onCreate?: () => void;
  onUpdate?: (title: string | undefined) => void;
  onError?: (error: any) => void;
  getMEME?: () => Promise<MEME | null>;
  comment?: TaggedComment | null;
  hasError?: boolean;
  loading?: boolean;
};

export const Tag: React.FC<Props> = ({
  comment,
  hasError,
  loading,
  getMEME,
  onRefresh,
  onError,
  onCreate,
  onUpdate
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const summary: Summary | null = useMemo(() => {
    return comment?.summary || null;
  }, [comment]);
  const alternatives: SummaryOption[] = useMemo(() => {
    return summary?.alternatives ?? [];
  }, [summary]);
  const desc: string | null = useMemo(() => {
    if (!summary) {
      return null;
    }
    const { description } = summary;
    if (description) {
      return description + ' ';
    }
    return '';
  }, [summary]);
  const hasAlternatives = alternatives.length > 0;

  useEffect(() => {
    setOptionsOpen(false);
  }, [summary, comment]);

  const handleError = useCallback(
    (err: any) => {
      console.error('Failed to get MEME', err);
      if (!onError) {
        return;
      }
      onError(err);
    },
    [onError]
  );

  const openExistingComment = useCallback(
    (target: Summary | SummaryOption | null) => {
      if (!target) {
        if (onUpdate) {
          onUpdate(undefined);
        }
        return;
      }
      if (target.has_code && target.page_url) {
        window.open(target.page_url);
        return;
      }
      if (onUpdate) {
        if ('title' in target) {
          onUpdate(target.title);
        } else {
          onUpdate(undefined);
        }
      }
    },
    [onUpdate]
  );

  const handleSelectAlternative = useCallback(
    (option: SummaryOption) => {
      setOptionsOpen(false);
      openExistingComment(option);
    },
    [openExistingComment]
  );

  const handleCreate = useCallback(() => {
    setOptionsOpen(false);
    if (!onCreate) {
      return;
    }
    onCreate();
  }, [onCreate]);

  const handlePrimaryClick = useCallback(() => {
    if (!getMEME) {
      return;
    }
    getMEME()
      .then(() => {
        if (!comment) {
          handleCreate();
          return;
        }
        if (hasAlternatives) {
          setOptionsOpen(prev => !prev);
          return;
        }
        openExistingComment(summary);
      })
      .catch(handleError);
  }, [
    getMEME,
    summary,
    comment,
    handleCreate,
    hasAlternatives,
    openExistingComment,
    handleError
  ]);

  return (
    <div className={`nbtags-tag ${desc !== null ? 'nbtags-has-page' : ''}`}>
      <div className="item_name">
        <i
          className={`fa fa-refresh  nbtags-refresh ${
            loading ? 'fa-spin' : ''
          }`}
          onClick={e => {
            e.stopPropagation();
            if (onRefresh) {
              onRefresh();
            }
          }}
        />
        {desc}
        {summary && (
          <>
            <i
              className="fa fa-comments"
              onClick={e => {
                e.stopPropagation();
                handlePrimaryClick();
              }}
            />
            {summary.count}
          </>
        )}
        {!summary && (
          <>
            <i
              className="fa fa-comments"
              onClick={e => {
                e.stopPropagation();
                if (onCreate) {
                  onCreate();
                }
              }}
            />
          </>
        )}
        {hasError && <span className="nbtags-error">!</span>}
      </div>
      {summary && hasAlternatives && optionsOpen && (
        <div className="nbtags-comment-options">
          <div className="nbtags-comment-options__list">
            {alternatives.map(option => (
              <button
                type="button"
                className="nbtags-comment-option"
                key={`${option.title}-${option.page_url || 'no-url'}`}
                onClick={() => handleSelectAlternative(option)}
              >
                <span className="nbtags-comment-option__title">
                  {option.title}
                </span>
                {option.description && (
                  <span className="nbtags-comment-option__desc">
                    {option.description}
                  </span>
                )}
              </button>
            ))}
          </div>
          {onCreate && (
            <button
              type="button"
              className="nbtags-comment-option nbtags-comment-option--create"
              onClick={handleCreate}
            >
              + Create new comment
            </button>
          )}
        </div>
      )}
    </div>
  );
};
