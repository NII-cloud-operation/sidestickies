import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { toggleComment, commentIsVisible } from '../components/notebook';

const BUTTON_LOCATION = 11;

export class ToolbarExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  createNew(
    widget: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): void | IDisposable {
    let button: ToolbarButton | null = null;
    button = new ToolbarButton({
      className: 'sidestickies-comment-toggle',
      iconClass: 'fas fa-comments',
      label: 'Sidestickies',
      tooltip: 'show/hide sidestickies',
      onClick() {
        if (!widget.model) {
          throw new Error('No notebook model');
        }
        if (!button) {
          throw new Error('No button');
        }
        toggleComment(widget.model);
      }
    });
    widget.toolbar.insertItem(
      BUTTON_LOCATION,
      'sidestickies-comment-toggle',
      button
    );
    widget.content.model?.metadataChanged.connect(() => {
      if (!button) {
        return;
      }
      this.updateToggle(widget, button);
    });
    this.updateToggle(widget, button);

    return new DisposableDelegate(() => {
      if (!button) {
        return;
      }
      button.dispose();
    });
  }

  updateToggle(widget: NotebookPanel, button: ToolbarButton) {
    if (!widget.model) {
      return;
    }
    if (commentIsVisible(widget.model)) {
      button.addClass('sidestickies-comment-visible');
    } else {
      button.removeClass('sidestickies-comment-visible');
    }
  }
}
