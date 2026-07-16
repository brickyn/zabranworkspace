"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strQuery = exports.strParam = void 0;
/**
 * Safely extracts a string parameter from Express req.params or req.query.
 * Handles cases where the value may be string | string[] | undefined.
 */
const strParam = (val) => {
    if (Array.isArray(val))
        return val[0] || '';
    return val || '';
};
exports.strParam = strParam;
const strQuery = (val) => {
    if (Array.isArray(val))
        return val[0];
    return val;
};
exports.strQuery = strQuery;
//# sourceMappingURL=params.js.map