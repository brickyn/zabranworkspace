"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = { success: true };
    if (message)
        response.message = message;
    if (data !== undefined)
        response.data = data;
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 500, details) => {
    const response = { success: false, error };
    if (details)
        response.details = details;
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map