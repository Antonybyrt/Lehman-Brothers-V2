/**
 * Utils Exports
 * Centralized exports for utility functions
 */

export { handleHttpError, shouldRedirectToErrorPage, getErrorPagePath } from './errorHandler'
export type { ErrorResponse } from './errorHandler'
export { setupAxiosInterceptors, createAxiosInstance } from './axiosInterceptor'

