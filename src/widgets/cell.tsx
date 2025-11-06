import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { Cell } from '@jupyterlab/cells';
import { INotebookModel } from '@jupyterlab/notebook';
import { CellTag } from '../components/cell';
import { ITagLoader } from '../components/loader';
import { getBaseUrl } from '../handler';
import { showErrorOnNotification } from './base';

const max_content_length = 1024;

export class CellTagWidget extends ReactWidget {
  constructor(
    private notebook: INotebookModel,
    private cell: Cell,
    private loader: ITagLoader
  ) {
    super();
    this.addClass('nbtags-widget-root');
  }

  private getContent = async () => {
    const { metadata } = this.cell.model;
    const jsonContent = this.cell.model.toJSON();
    const source = jsonContent['source'] as string;
    const content: any = {};
    content['cell_type'] = this.cell.model.type;
    content['metadata'] = { lc_cell_meme: metadata['lc_cell_meme'] };
    content['source'] =
      source?.length < max_content_length
        ? source
        : source.substring(0, max_content_length - 2) + '..';
    return JSON.stringify(content);
  };

  private createPage = () => {
    const url = getBaseUrl('cell');
    this.getContent()
      .then(content => {
        const cellurl = url + '?' + 'cell' + '=' + encodeURIComponent(content);
        window.open(cellurl);
      })
      .catch((error: any) => {
        console.error('Failed to get content', error);
      });
  };

  private updatePage = (title: string | undefined) => {
    console.log('[sidestickies] updatePage called, title:', title);
    const url = getBaseUrl('cell');
    this.getContent()
      .then(content => {
        console.log('[sidestickies] getContent resolved, opening window');
        const cellurl =
          url +
          '?title=' +
          encodeURIComponent(title || '') +
          '&mode=edit' +
          '&' +
          'cell' +
          '=' +
          encodeURIComponent(content);
        console.log('[sidestickies] calling window.open with:', cellurl);
        window.open(cellurl);
        console.log('[sidestickies] window.open returned');
      })
      .catch((error: any) => {
        console.error('Failed to get content', error);
      });
  };

  render(): JSX.Element {
    return (
      <div className="nbtags-base nbtags-cell-base">
        <CellTag
          notebook={this.notebook}
          cell={this.cell}
          loader={this.loader}
          onError={showErrorOnNotification}
          onCreate={this.createPage}
          onUpdate={this.updatePage}
        />
      </div>
    );
  }
}
