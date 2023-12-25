import { Widget } from '@lumino/widgets';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { NotebookTagWidget } from '../widgets/notebook';
import { BaseMEMELoader, BaseTagLoader } from './base';

class TagLoader extends BaseTagLoader {
  constructor() {
    super('notebook');
  }
}

class MEMELoader extends BaseMEMELoader {
  constructor() {
    super();
  }
}

export class NotebookExtension {
  private widget: NotebookTagWidget | null = null;
  private memeLoader: MEMELoader;
  private loader: TagLoader;
  constructor(
    private path: string,
    private settings: ISettingRegistry.ISettings,
    private notebookPanel: NotebookPanel | null
  ) {
    this.memeLoader = new MEMELoader();
    this.loader = new TagLoader();
  }

  start(app: JupyterFrontEnd) {
    const widgets = Array.from(app.shell.widgets('menu'));
    if (widgets.length === 0) {
      setTimeout(() => {
        this.start(app);
      }, 10);
      return;
    }
    const menu = document.querySelector('#menu-panel-wrapper');
    this.widget = new NotebookTagWidget(
      this.settings,
      this.notebookPanel,
      this.memeLoader,
      this.path,
      this.loader
    );
    Widget.attach(this.widget, menu as HTMLElement);
  }
}
