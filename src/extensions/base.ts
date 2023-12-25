import { requestAPI } from '../handler';
import { ITagLoader, IMEMELoader } from '../components/loader';
import { TaggedComment } from '../components/types';

export class BaseTagLoader implements ITagLoader {
  private queue: {
    meme: string;
    resolve: (result: TaggedComment) => void;
    reject: (reason: any) => void;
  }[] = [];
  private hasFetcher = false;

  constructor(private type: 'cell' | 'notebook') {}

  async load(meme: string) {
    return new Promise<TaggedComment>((resolve, reject) => {
      this.queue.push({
        meme,
        resolve,
        reject
      });
      if (this.hasFetcher) {
        return;
      }
      this.hasFetcher = true;
      setTimeout(() => {
        this.requestFetcher();
      }, 0);
    });
  }

  private requestFetcher() {
    if (this.queue.length === 0) {
      return;
    }
    const next = this.queue.shift();
    if (!next) {
      throw new Error('Unexpected error');
    }
    const { meme, resolve, reject } = next;
    const nextFetcher = () => {
      if (this.queue.length === 0) {
        this.hasFetcher = false;
        return;
      }
      setTimeout(() => {
        this.requestFetcher();
      }, 0);
    };
    requestAPI<TaggedComment>(`${this.type}/${meme}`)
      .then(result => {
        resolve(result);
        nextFetcher();
      })
      .catch(reason => {
        reject(reason);
        nextFetcher();
      });
  }
}

export class BaseMEMELoader implements IMEMELoader {
  private queue: {
    path: string;
    resolve: (result: any) => void;
    reject: (reason: any) => void;
  }[] = [];
  private hasFetcher = false;

  constructor() {}

  async load<T>(path: string) {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        path,
        resolve,
        reject
      });
      if (this.hasFetcher) {
        return;
      }
      this.hasFetcher = true;
      setTimeout(() => {
        this.requestFetcher();
      }, 0);
    });
  }

  private requestFetcher() {
    if (this.queue.length === 0) {
      return;
    }
    const next = this.queue.shift();
    if (!next) {
      throw new Error('Unexpected error');
    }
    const { path, resolve, reject } = next;
    const nextFetcher = () => {
      if (this.queue.length === 0) {
        this.hasFetcher = false;
        return;
      }
      setTimeout(() => {
        this.requestFetcher();
      }, 0);
    };
    requestAPI<any>(`notebook/${path}/meme`)
      .then(result => {
        resolve(result);
        nextFetcher();
      })
      .catch(reason => {
        reject(reason);
        nextFetcher();
      });
  }
}
