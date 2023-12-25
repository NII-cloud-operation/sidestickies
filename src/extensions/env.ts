import { JupyterFrontEnd } from '@jupyterlab/application';
import { TabPanel } from '@lumino/widgets';

export type EnvironmentConfig = {
  notebook7: boolean;
  path?: string;
};

type ContentPanel = {
  context?: {
    path: string;
  };
};

export class EnvironmentDetector {
  constructor(private callback: (config: EnvironmentConfig) => void) {}

  start(app: JupyterFrontEnd) {
    this.check(app);
  }

  check(app: JupyterFrontEnd) {
    const widgets = Array.from(app.shell.widgets('main'));
    if (widgets.length === 0) {
      setTimeout(() => {
        this.check(app);
      }, 10);
      return;
    }
    const content = widgets[0] as ContentPanel;
    if (content.context) {
      this.callback({
        notebook7: true,
        path: content.context.path
      });
      return;
    }
    const tab = widgets[0] as TabPanel;
    if (!tab.addWidget) {
      this.callback({
        notebook7: false
      });
      return;
    }
    this.callback({
      notebook7: true
    });
  }
}
