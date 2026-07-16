/**
 * Safely extracts a string parameter from Express req.params or req.query.
 * Handles cases where the value may be string | string[] | undefined.
 */
export declare const strParam: (val: string | string[] | undefined) => string;
export declare const strQuery: (val: string | string[] | undefined) => string | undefined;
//# sourceMappingURL=params.d.ts.map