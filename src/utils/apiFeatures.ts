export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export const parseQueryParams = (query: Record<string, any>) => {
  const queryParams = { ...query };
  const excludedFields = ["page", "limit", "sort", "fields"];
  excludedFields.forEach((field) => delete queryParams[field]);
  return queryParams;
};

export const getPaginationOptions = (
  query: Record<string, any>
): PaginationOptions => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { page, limit };
};
