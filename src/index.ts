import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CellExtension } from './extensions/cell';
import { ToolbarExtension } from './extensions/toolbar';
import { attachFileBrowser } from './extensions/file';
import { NotebookExtension } from './extensions/notebook';
import { EnvironmentDetector } from './extensions/env';

/**
 * Initialization data for the sidestickies extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidestickies:plugin',
  description: 'Sidestickies Jupyter Extension',
  autoStart: true,
  requires: [ISettingRegistry, IFileBrowserFactory],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry,
    fileBrowserFactory: IFileBrowserFactory
  ) => {
    console.log('JupyterLab extension sidestickies is activated!');

    app.docRegistry.addWidgetExtension('Notebook', new CellExtension());
    app.docRegistry.addWidgetExtension('Notebook', new ToolbarExtension());
    settingRegistry
      .load(plugin.id)
      .then(settings => {
        const envDetector = new EnvironmentDetector(config => {
          attachFileBrowser(settings, fileBrowserFactory, config);
          if (config.notebook7 && config.path) {
            const widget =
              fileBrowserFactory.tracker.currentWidget?.model.manager.findWidget(
                config.path
              ) as NotebookPanel;
            new NotebookExtension(config.path, settings, widget).start(app);
          }
        });
        envDetector.start(app);
      })
      .catch(reason => {
        console.error(reason);
      });
  }
};

export default plugin;
