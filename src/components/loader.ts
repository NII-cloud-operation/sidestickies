import { TaggedComment } from './types';

export interface ITagLoader {
  load(meme: string): Promise<TaggedComment>;
}

export interface IMEMELoader {
  load<T>(path: string): Promise<T>;
}
