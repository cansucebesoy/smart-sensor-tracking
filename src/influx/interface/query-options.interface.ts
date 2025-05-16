export interface QueryOptions {
  start: string;
  end: string;
  fields: string[];
  sort: 'asc' | 'desc';
  limit: number;
  offset: number;
}
