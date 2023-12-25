import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { NotebookTag } from '../components/notebook';
import { IMEMELoader, ITagLoader } from '../components/loader';
import { showErrorOnNotification } from './base';

export class NotebookTagWidget extends ReactWidget {
  constructor(
    private settings: ISettingRegistry.ISettings,
    private notebookPanel: NotebookPanel | null,
    private memeLoader: IMEMELoader,
    private path: string,
    private loader: ITagLoader
  ) {
    super();
    this.addClass('nbtags-widget-root');
  }

  render(): JSX.Element {
    return (
      <div className="nbtags-base nbtags-tree-base">
        <NotebookTag
          settings={this.settings}
          notebookPanel={this.notebookPanel}
          memeLoader={this.memeLoader}
          loader={this.loader}
          path={this.path}
          onError={showErrorOnNotification}
        />
      </div>
    );
  }
}
