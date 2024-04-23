import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Cell } from '@jupyterlab/cells';
import { INotebookModel } from '@jupyterlab/notebook';
import { TaggedComment, MEME } from './types';
import { Tag } from './base';
import { ITagLoader } from './loader';
import { commentIsVisible } from './notebook';

type Props = {
  loader?: ITagLoader;
  notebook: INotebookModel;
  cell: Cell;
  onRefresh?: () => void;
  onCreate?: () => void;
  onUpdate?: (title: string | undefined) => void;
  onError?: (error: any) => void;
  hasError?: boolean;
};

export const CellTag: React.FC<Props> = ({
  notebook,
  cell,
  loader,
  ...props
}) => {
  const [comment, setComment] = useState<TaggedComment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const meme = useMemo(() => {
    const { metadata } = cell.model;
    if (!metadata) {
      return null;
    }
    return metadata['lc_cell_meme'] as MEME;
  }, [cell]);
  const getMEME = useCallback(() => {
    return new Promise<MEME | null>(resolve => {
      resolve(meme);
    });
  }, [meme]);

  const refresh = useCallback(() => {
    if (!loader) {
      return;
    }
    const { current } = meme || {};
    if (!current) {
      return;
    }
    setLoading(true);
    loader
      .load(current)
      .then(comment => {
        setComment(comment);
        setLoading(false);
        setHasError(false);
      })
      .catch((error: any) => {
        setLoading(false);
        setHasError(true);
        const { onError } = props;
        console.error('Failed to load comment', error);
        if (!onError) {
          return;
        }
        onError(error);
      });
  }, [loader, meme]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    refresh();
  }, [loader, meme, visible]);
  useEffect(() => {
    setVisible(commentIsVisible(notebook));
    notebook.metadataChanged.connect(() => {
      setVisible(commentIsVisible(notebook));
    });
  }, [notebook]);

  if (!meme) {
    return null;
  }
  if (!visible) {
    return null;
  }
  return (
    <Tag
      {...props}
      getMEME={getMEME}
      comment={comment}
      loading={loading}
      onRefresh={refresh}
      hasError={hasError}
    />
  );
};
