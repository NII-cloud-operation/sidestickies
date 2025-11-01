import React, { useCallback, useEffect, useState } from 'react';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MEME, NotebookMetadata, TaggedComment } from './types';
import { Tag } from './base';
import { ITagLoader, IMEMELoader } from './loader';
import { requestAPI, getBaseUrl } from '../handler';

const max_content_length = 1024;

export function commentIsVisible(notebook: INotebookModel): boolean {
  const { metadata } = notebook;
  if (!metadata) {
    return false;
  }
  const { sidestickies } = metadata as NotebookMetadata;
  if (!sidestickies) {
    return false;
  }
  const { visible } = sidestickies;
  return visible || false;
}

export function toggleComment(notebook: INotebookModel): boolean {
  const { metadata } = notebook;
  if (!metadata) {
    throw new Error('No notebook metadata');
  }
  const { sidestickies } = metadata as NotebookMetadata;
  if (!sidestickies) {
    notebook.setMetadata('sidestickies', { visible: true });
    return true;
  }
  sidestickies.visible = !sidestickies.visible;
  notebook.setMetadata('sidestickies', sidestickies);
  return sidestickies.visible || false;
}

export function normalizeTOC(toc: string[]) {
  const ntoc = [];
  let ntoclen = 0;
  let exceed = false;
  toc.forEach(line => {
    if (ntoclen + line.length >= max_content_length - 2) {
      exceed = true;
      return;
    }
    ntoc.push(line);
    ntoclen += line.length;
  });
  if (exceed) {
    ntoc.push('..');
  }
  return ntoc;
}

type Props = {
  settings: ISettingRegistry.ISettings;
  notebookPanel: NotebookPanel | null;
  memeLoader?: IMEMELoader;
  loader?: ITagLoader;
  path?: string;
  onRefresh?: () => void;
  onError?: (error: any) => void;
  hasError?: boolean;
};

type MEMEResponse = {
  path: string;
  meme: MEME;
  toc: string[];
};

export const NotebookTag: React.FC<Props> = ({
  settings,
  notebookPanel,
  path,
  memeLoader,
  loader,
  onError,
  ...props
}) => {
  const [comment, setComment] = useState<TaggedComment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [meme, setMEME] = useState<MEME | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

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
      })
      .catch((error: any) => {
        setLoading(false);
        console.error('Failed to load comment', error);
        if (!onError) {
          return;
        }
        onError(error);
      });
  }, [loader, meme, onError]);

  const getContent = useCallback(async () => {
    const encodedPath = encodeURIComponent(path || '');
    const resp = await requestAPI<MEMEResponse>(`notebook/${encodedPath}/meme`);
    if (!resp.meme || !resp.meme.current) {
      throw new Error('Notebook has not been saved yet. Please save the notebook first.');
    }
    const memeCurrent = {
      current: resp.meme.current
    };
    return JSON.stringify({
      meme: memeCurrent,
      toc: normalizeTOC(resp.toc)
    });
  }, [path]);

  const createPage = useCallback(() => {
    const url = getBaseUrl('notebook');
    getContent()
      .then(content => {
        const notebookUrl =
          url + '?' + 'notebook' + '=' + encodeURIComponent(content);
        window.open(notebookUrl);
      })
      .catch((error: any) => {
        console.error('Failed to get content', error);
        if (!onError) {
          return;
        }
        onError(error);
      });
  }, [getContent, onError]);

  const updatePage = useCallback(
    (title: string | undefined) => {
      const url = getBaseUrl('notebook');
      getContent()
        .then(content => {
          const notebookUrl =
            url +
            '?title=' +
            encodeURIComponent(title || '') +
            '&mode=edit' +
            '&' +
            'notebook' +
            '=' +
            encodeURIComponent(content);
          window.open(notebookUrl);
        })
        .catch((error: any) => {
          console.error('Failed to get content', error);
          if (!onError) {
            return;
          }
          onError(error);
        });
    },
    [getContent, onError]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    refresh();
  }, [loader, meme, visible]);

  useEffect(() => {
    if (notebookPanel && notebookPanel.model) {
      const { model } = notebookPanel;
      setVisible(commentIsVisible(model));
      notebookPanel.model.metadataChanged.connect(() => {
        setVisible(commentIsVisible(model));
      });
      return;
    }
    setVisible(settings.get('notebookCommentVisible').composite as boolean);
    settings.changed.connect(() => {
      setVisible(settings.get('notebookCommentVisible').composite as boolean);
    });
  }, [settings]);

  useEffect(() => {
    if (!memeLoader || !path) {
      return;
    }
    setLoading(true);
    memeLoader
      .load<MEMEResponse>(path)
      .then(response => {
        const { meme } = response;
        if (!meme) {
          setMEME(null);
          setLoading(false);
          setHasError(false);
          return;
        }
        setMEME(meme);
        setLoading(false);
        setHasError(false);
      })
      .catch((error: any) => {
        setLoading(false);
        setHasError(true);
        console.error('Failed to load comment', error);
        if (!onError) {
          return;
        }
        onError(error);
      });
  }, [memeLoader, path, onError]);

  if (!visible) {
    return null;
  }
  return (
    <Tag
      {...props}
      getMEME={getMEME}
      comment={comment}
      loading={loading}
      onCreate={createPage}
      onUpdate={updatePage}
      onError={onError}
      onRefresh={refresh}
      hasError={hasError}
    />
  );
};
