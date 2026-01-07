/**
 * Error Handler Utility
 * Centralized error handling for HTTP errors
 * Redirects to appropriate error pages (404, 500) based on status codes
 */

import { AxiosError } from 'axios'
import Router from 'next/router'

export interface ErrorResponse {
  success: false
  error: string
  errorType?: string
}

/**
 * Handle HTTP errors and redirect to appropriate error pages
 * @param error - Axios error or generic error
 * @param redirect - Whether to redirect to error pages (default: true)
 * @returns Error response object
 */
export function handleHttpError(
  error: unknown,
  redirect: boolean = true
): ErrorResponse {
  // Check if it's an Axios error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>
    const status = axiosError.response?.status
    const data = axiosError.response?.data

    // Handle 404 errors - Not Found
    if (status === 404) {
      if (redirect && typeof window !== 'undefined') {
        Router.push('/404')
      }
      return {
        success: false,
        error: data?.error || 'Resource not found',
        errorType: 'not_found'
      }
    }

    // Handle 500 errors - Internal Server Error
    if (status === 500 || status === 502 || status === 503 || status === 504) {
      if (redirect && typeof window !== 'undefined') {
        Router.push('/500')
      }
      return {
        success: false,
        error: data?.error || 'Internal server error',
        errorType: 'server'
      }
    }

    // Handle other HTTP errors (400, 401, 403, etc.)
    return {
      success: false,
      error: data?.error || `HTTP ${status} error occurred`,
      errorType: data?.errorType || 'http_error'
    }
  }

  // Handle network errors (no response)
  if (error && typeof error === 'object' && 'message' in error) {
    const networkError = error as { message: string }
    if (networkError.message.includes('Network Error') || networkError.message.includes('timeout')) {
      // Network errors could indicate server issues, but we don't redirect to 500
      // as it might be a client-side connectivity issue
      return {
        success: false,
        error: 'Network error occurred. Please check your connection.',
        errorType: 'network'
      }
    }
  }

  // Generic error fallback
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    errorType: 'unknown'
  }
}

/**
 * Check if error should trigger a redirect to error page
 * @param status - HTTP status code
 * @returns boolean indicating if redirect is needed
 */
export function shouldRedirectToErrorPage(status?: number): boolean {
  return status === 404 || status === 500 || status === 502 || status === 503 || status === 504
}

/**
 * Get error page path based on status code
 * @param status - HTTP status code
 * @returns Error page path or null
 */
export function getErrorPagePath(status?: number): string | null {
  if (status === 404) return '/404'
  if (status === 500 || status === 502 || status === 503 || status === 504) return '/500'
  return null
}

