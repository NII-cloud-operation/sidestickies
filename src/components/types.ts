export type NotebookMetadata = {
  sidestickies?: {
    visible?: boolean;
  };
};

export type Page = any;

export type Summary = {
  description?: string;
  count?: string;
  has_code?: boolean;
  page_url?: string;
  title?: string;
};

export type TaggedComment = {
  meme?: string;
  page?: Page;
  summary?: Summary;
};

export type MEME = {
  current?: string;
};
