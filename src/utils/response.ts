export function successResponse<T>(data: T, meta?: any) {
  if (meta) {
    return { data, meta };
  }
  return { data };
}

export function errorResponse(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  };
}
