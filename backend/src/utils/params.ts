/**
 * Safely extracts a string parameter from Express req.params or req.query.
 * Handles cases where the value may be string | string[] | undefined.
 */
export const strParam = (val: string | string[] | undefined): string => {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
};

export const strQuery = (val: string | string[] | undefined): string | undefined => {
  if (Array.isArray(val)) return val[0];
  return val;
};
