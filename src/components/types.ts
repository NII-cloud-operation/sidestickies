export type NotebookMetadata = {
  sidestickies?: {
    visible?: boolean;
  };
};

export type Page = any;

export type SummaryOption = {
  title: string;
  description?: string;
  page_url?: string;
  has_code?: boolean;
};

export type Summary = {
  description?: string;
  count?: string | number;
  has_code?: boolean;
  page_url?: string;
  title?: string;
  alternatives?: SummaryOption[];
};

export type TaggedComment = {
  meme?: string;
  page?: Page;
  summary?: Summary;
};

export type MEME = {
  current?: string;
};
