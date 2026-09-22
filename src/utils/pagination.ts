export function calculatePaginationMeta(total: number, limit: number, offset: number, returnedCount: number) {
  return {
    total,
    limit,
    offset,
    hasMore: offset + returnedCount < total,
  };
}
