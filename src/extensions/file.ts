import { IDisposable } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { IFileBrowserFactory, FileBrowser } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';
import { Toolbar } from '@jupyterlab/ui-components';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { EnvironmentConfig } from './env';
import { NotebookTagWidget } from '../widgets/notebook';
import { ITagLoader, IMEMELoader } from '../components/loader';
import { BaseTagLoader, BaseMEMELoader } from './base';

let currentExtension: FileBrowserExtension | null = null;

export function attachFileBrowser(
  settings: ISettingRegistry.ISettings,
  factory: IFileBrowserFactory,
  envConfig: EnvironmentConfig
) {
  const browser = factory.tracker.currentWidget;
  if (browser) {
    currentExtension = new FileBrowserExtension(settings, browser);
    currentExtension.start(envConfig);
  }
  factory.tracker.currentChanged.connect((_, args) => {
    if (currentExtension) {
      currentExtension.dispose();
      currentExtension = null;
    }
    if (!args) {
      return;
    }
    currentExtension = new FileBrowserExtension(settings, args);
    currentExtension.start(envConfig);
  });
}

function insertItemBefore(
  target: Toolbar<Widget>,
  name: string,
  item: Widget,
  originClassName: string,
  timeout: number
) {
  if (timeout < 0) {
    console.warn('Origin not found', originClassName);
    target.addItem(name, item);
    return;
  }
  const children = new Array(...target.children())
    .map((element, index) => ({
      element,
      index
    }))
    .filter(({ element }) => element.node.classList.contains(originClassName));
  if (children.length > 0) {
    const { index } = children[0];
    target.insertItem(index, name, item);
    return;
  }
  const nextTimeout = 100;
  setTimeout(() => {
    insertItemBefore(
      target,
      name,
      item,
      originClassName,
      timeout - nextTimeout
    );
  }, nextTimeout);
}

class FileNode implements IDisposable {
  isDisposed: boolean = false;
  private observer: MutationObserver | null = null;
  private currentFileName: string | null = null;
  private widget: NotebookTagWidget | null = null;
  constructor(
    private settings: ISettingRegistry.ISettings,
    private element: Element,
    private path: string,
    private memeLoader: IMEMELoader,
    private loader: ITagLoader
  ) {}

  dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.widget) {
      this.widget.dispose();
      this.widget = null;
    }
    this.isDisposed = true;
  }

  get fileName(): string | null {
    const text = this.element.querySelector('.jp-DirListing-itemText');
    return text?.textContent || null;
  }

  get isNotebook(): boolean {
    if (!this.fileName) {
      return false;
    }
    return this.fileName.toLowerCase().endsWith('.ipynb');
  }

  private attachNewWidget() {
    this.currentFileName = this.fileName;
    if (!this.isNotebook) {
      return;
    }
    if (!this.fileName) {
      throw new Error('Unexpected state');
    }
    this.widget = new NotebookTagWidget(
      this.settings,
      null,
      this.memeLoader,
      URLExt.join(this.path, this.fileName),
      this.loader
    );
    Widget.attach(this.widget, this.element as HTMLElement);
  }

  attach() {
    const observer = new MutationObserver((mutations, observer) => {
      if (this.fileName === this.currentFileName) {
        return;
      }
      if (this.widget) {
        this.widget.dispose();
        this.widget = null;
      }
      this.attachNewWidget();
    });
    observer.observe(this.element, {
      subtree: true,
      characterData: true
    });
    this.observer = observer;
    this.attachNewWidget();
  }
}

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

class FileBrowserExtension implements IDisposable {
  private files: FileNode[] | null = null;
  private loader: TagLoader;
  private memeLoader: MEMELoader;

  constructor(
    private settings: ISettingRegistry.ISettings,
    private browser: FileBrowser
  ) {
    this.loader = new TagLoader();
    this.memeLoader = new MEMELoader();
  }
  isDisposed: boolean = false;

  get documentManager() {
    return this.browser.model.manager;
  }

  get(path: string): Promise<Contents.IModel> {
    return this.documentManager.services.contents.get(path);
  }

  dispose() {
    this.isDisposed = true;
  }

  updateFiles() {
    if (this.files !== null && this.files.length > 0) {
      return;
    }
    const elements = this.browser.node.querySelectorAll(
      'li.jp-DirListing-item'
    );
    const files: FileNode[] = [];
    elements.forEach(element => {
      const fileNode = new FileNode(
        this.settings,
        element,
        this.browser.model.path,
        this.memeLoader,
        this.loader
      );
      files.push(fileNode);
    });
    this.files = files;
    files.forEach(file => {
      file.attach();
    });
  }

  cleanObservers() {
    const oldFiles = this.files;
    this.files = null;
    if (!oldFiles) {
      return;
    }
    oldFiles.forEach(file => file.dispose());
  }

  start(envConfig: EnvironmentConfig) {
    const button: ToolbarButton = new ToolbarButton({
      className: 'sidestickies-comment-toggle',
      iconClass: 'fas fa-comments',
      onClick: () => {
        let visible = false;
        if (!button.hasClass('sidestickies-comment-visible')) {
          button.addClass('sidestickies-comment-visible');
          visible = true;
        } else {
          button.removeClass('sidestickies-comment-visible');
        }
        this.settings.set('notebookCommentVisible', visible);
      },
      label: envConfig.notebook7 ? 'Sidestickies' : '',
      tooltip: 'show/hide sidestickies'
    });
    const visible = this.settings.get('notebookCommentVisible')
      .composite as boolean;
    if (visible) {
      button.addClass('sidestickies-comment-visible');
    }
    insertItemBefore(
      this.browser.toolbar,
      'sidestickies-notebook-toggle',
      button,
      'jp-ToolbarButtonComponent',
      1000
    );
    const observer = new MutationObserver((mutations, observer) => {
      this.updateFiles();
    });
    observer.observe(this.browser.node, {
      childList: true,
      subtree: true
    });
    this.updateFiles();
    this.browser.model.pathChanged.connect((_, change) => {
      this.cleanObservers();
      this.updateFiles();
    });
  }
}
