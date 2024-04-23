import { Widget } from '@lumino/widgets';
import { INotebookModel, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { Cell } from '@jupyterlab/cells';
//import { registerToolbarButtons } from './toolbar';
import { CellTagWidget } from '../widgets/cell';
import { ITagLoader } from '../components/loader';
import { BaseTagLoader } from './base';

export class CellExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  private loader: TagLoader;

  constructor() {
    this.loader = new TagLoader();
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): void | IDisposable {
    panel.content.model?.cells.changed.connect((_, change) => {
      if (change.type === 'add') {
        change.newValues.forEach(cellModel => {
          const cell = getCellByModelId(panel.content, cellModel.id);
          if (!cell) {
            return;
          }
          cell.inViewportChanged.connect((_, isAttached) => {
            if (!isAttached) {
              return;
            }
            if (!panel.content.model) {
              throw new Error('No notebook model');
            }
            initCell(panel.content.model, cell as Cell, this.loader);
          });
        });
      }
    });
    return new DisposableDelegate(() => {});
  }
}

export class TagLoader extends BaseTagLoader {
  constructor() {
    super('cell');
  }
}

function initCell(notebook: INotebookModel, cell: Cell, loader: ITagLoader) {
  Widget.attach(new CellTagWidget(notebook, cell, loader), cell.node);
}

function getCellByModelId(notebook: Notebook, cellModelId: string) {
  return notebook.widgets.find(c => c.model.id === cellModelId);
}
