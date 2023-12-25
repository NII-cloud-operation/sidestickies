import React, { useCallback, useMemo } from 'react';
import { TaggedComment, Summary, MEME } from './types';

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
  const summary: Summary | null = useMemo(() => {
    return comment?.summary || null;
  }, [comment]);
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
  const updateComment = useCallback(() => {
    if (!getMEME) {
      return;
    }
    getMEME()
      .then(meme => {
        if (comment?.meme !== meme?.current) {
          if (!onCreate) {
            return;
          }
          onCreate();
        } else if (!summary?.has_code) {
          if (!onUpdate) {
            return;
          }
          onUpdate(summary?.title);
        } else if (summary?.page_url) {
          window.open(summary.page_url);
        }
      })
      .catch(err => {
        console.error('Failed to get MEME', err);
        if (!onError) {
          return;
        }
        onError(err);
      });
  }, [summary, comment, getMEME, onError, onCreate, onUpdate]);

  return (
    <div className={`nbtags-tag ${desc !== null ? 'nbtags-has-page' : ''}`}>
      <div className="item_name">
        <i
          className={`fa fa-refresh  nbtags-refresh ${
            loading ? 'fa-spin' : ''
          }`}
          onClick={onRefresh}
        />
        {desc}
        {summary && (
          <>
            <i className="fa fa-comments" onClick={updateComment} />
            {summary.count}
          </>
        )}
        {!summary && (
          <>
            <i className="fa fa-comments" onClick={onCreate} />
          </>
        )}
        {hasError && <span className="nbtags-error">!</span>}
      </div>
    </div>
  );
};
