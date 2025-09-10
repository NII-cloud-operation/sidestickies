import { Widget } from '@lumino/widgets';
import { INotebookModel, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { Cell, MarkdownCell } from '@jupyterlab/cells';
//import { registerToolbarButtons } from './toolbar';
import { CellTagWidget } from '../widgets/cell';
import { ITagLoader } from '../components/loader';
import { BaseTagLoader } from './base';
import { requestAPI } from '../handler';
import { commentIsVisible } from '../components/notebook';

type ApiConfig = {
  api_type: string;
  ep_weave_url?: string;
};

export class CellExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  private loader: TagLoader;
  private apiConfigPromise: Promise<ApiConfig> | null = null;
  private epWeaveBaseUrl: string | null = null;

  constructor() {
    this.loader = new TagLoader();
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): void | IDisposable {
    // Keep track of initialized cells
    const initializedCells = new Set<string>();

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
            // Only initialize once per cell
            if (initializedCells.has(cellModel.id)) {
              return;
            }
            if (!panel.content.model) {
              throw new Error('No notebook model');
            }
            initCell(panel.content.model, cell as Cell, this.loader);
            initializedCells.add(cellModel.id);
            // If it's a markdown cell, add heading interceptor
            if (cellModel.type === 'markdown') {
              this.initMarkdownHeadingInterceptor(panel, cell as MarkdownCell);
            }
          });
        });
      }
    });
    return new DisposableDelegate(() => {});
  }
  
  private initMarkdownHeadingInterceptor(panel: NotebookPanel, cell: MarkdownCell): void {
    this.ensureApiConfig()
      .then(() => {
        if (!this.epWeaveBaseUrl) {
          return;
        }
        this.attachMarkdownHeadingObserver(panel, cell, this.epWeaveBaseUrl);
      })
      .catch(error => {
        console.error('[Sidestickies] Failed to load API configuration', error);
      });
  }
  
  private attachMarkdownHeadingObserver(
    panel: NotebookPanel,
    cell: MarkdownCell,
    epWeaveBaseUrl: string
  ): void {
    const model = panel.model;
    if (!model) {
      throw new Error('No notebook model');
    }

    const updateLinks = () => {
      const visible = this.isCommentVisible(panel);
      this.modifyMarkdownHeadings(cell, epWeaveBaseUrl, visible);
    };

    const observer = new MutationObserver(() => {
      updateLinks();
    });

    observer.observe(cell.node, {
      childList: true,
      subtree: true,
      attributes: false
    });

    const handleVisibilityChange = () => {
      updateLinks();
    };
    model.metadataChanged.connect(handleVisibilityChange);

    cell.disposed.connect(() => {
      observer.disconnect();
      model.metadataChanged.disconnect(handleVisibilityChange);
    });

    updateLinks();
  }
  
  private modifyMarkdownHeadings(
    cell: MarkdownCell,
    epWeaveBaseUrl: string,
    visible: boolean
  ): void {
    const renderedNode = cell.node.querySelector('.jp-MarkdownOutput');
    if (!renderedNode) {
      return;
    }
    
    const headers = renderedNode.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headers.forEach((header: Element) => {
      const headerElement = header as HTMLHeadingElement;
      const headingText = headerElement.textContent?.replace('¶', '').trim() || '';
      if (!headingText) {
        return;
      }

      let epWeaveLink = header.querySelector('.ss-heading-link') as
        | HTMLAnchorElement
        | null;

      if (!epWeaveLink) {
        // Create ep_weave link with Font Awesome icon
        epWeaveLink = document.createElement('a');
        epWeaveLink.className = 'ss-heading-link';
        epWeaveLink.innerHTML = '<i class="fa fa-comments"></i>';
        epWeaveLink.style.marginLeft = '8px';
        epWeaveLink.style.fontSize = '0.8em';
        epWeaveLink.style.textDecoration = 'none';
        epWeaveLink.style.cursor = 'pointer';
        epWeaveLink.style.color = '#666';
        epWeaveLink.title = `Link to ep_weave: ${headingText}`;
        const epWeaveUrl = this.buildEpWeaveUrl(epWeaveBaseUrl, headingText);
        if (!epWeaveUrl) {
          return;
        }
        epWeaveLink.href = epWeaveUrl;
        epWeaveLink.target = '_blank';
        epWeaveLink.rel = 'noopener noreferrer';

        epWeaveLink.onclick = e => {
          e.preventDefault();
          e.stopPropagation();
          window.open(epWeaveUrl, '_blank', 'noopener,noreferrer');
        };

        // Find the existing anchor link if it exists
        const existingAnchor = header.querySelector('.jp-InternalAnchorLink');
        if (existingAnchor) {
          // Insert before the existing anchor
          header.insertBefore(epWeaveLink, existingAnchor);
        } else {
          // Append at the end
          header.appendChild(epWeaveLink);
        }
      }

      epWeaveLink.style.display = visible ? '' : 'none';
      epWeaveLink.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  private buildEpWeaveUrl(epWeaveBaseUrl: string, headingText: string): string | null {
    const base = epWeaveBaseUrl.endsWith('/')
      ? epWeaveBaseUrl.slice(0, -1)
      : epWeaveBaseUrl;
    const encodedHeading = encodeURIComponent(headingText);
    return `${base}/t/${encodedHeading}`;
  }

  private ensureApiConfig(): Promise<ApiConfig> {
    if (this.apiConfigPromise) {
      return this.apiConfigPromise;
    }

    this.apiConfigPromise = requestAPI<ApiConfig>('config')
      .then(config => {
        if (config.api_type === 'EpWeaveAPI' && config.ep_weave_url) {
          this.epWeaveBaseUrl = config.ep_weave_url;
        } else {
          this.epWeaveBaseUrl = null;
        }
        return config;
      })
      .catch(error => {
        this.apiConfigPromise = null;
        throw error;
      });

    return this.apiConfigPromise;
  }

  private isCommentVisible(panel: NotebookPanel): boolean {
    const model = panel.model;
    if (!model) {
      throw new Error('No notebook model');
    }
    return commentIsVisible(model);
  }
}

export class TagLoader extends BaseTagLoader {
  constructor() {
    super('cell');
  }
}

function initCell(notebook: INotebookModel, cell: Cell, loader: ITagLoader) {
  // Check if widget already exists to prevent duplicates
  const existingWidget = cell.node.querySelector('.nbtags-widget-root');
  if (existingWidget) {
    return;
  }
  Widget.attach(new CellTagWidget(notebook, cell, loader), cell.node);
}

function getCellByModelId(notebook: Notebook, cellModelId: string) {
  return notebook.widgets.find(c => c.model.id === cellModelId);
}
