const POSTGRES_UNIQUE_VIOLATION = '23505';

/** drizzle-orm wraps driver errors, so the pg error code lives on `cause`. */
function pgErrorCode(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  if ('code' in error) {
    return error.code;
  }
  if ('cause' in error) {
    return pgErrorCode(error.cause);
  }
  return undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === POSTGRES_UNIQUE_VIOLATION;
}
