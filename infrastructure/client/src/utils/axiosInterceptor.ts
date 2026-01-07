/**
 * Axios Interceptor Setup
 * Configures global axios interceptors for error handling
 * Automatically redirects to error pages (404, 500) when appropriate
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import Router from 'next/router'
import { shouldRedirectToErrorPage } from './errorHandler'

/**
 * Setup response interceptor for error handling
 * This will catch all HTTP errors and redirect to appropriate error pages
 */
export function setupAxiosInterceptors(): void {
  // Response interceptor - handles errors
  axios.interceptors.response.use(
    (response) => {
      // Success response - pass through
      return response
    },
    (error: AxiosError) => {
      const status = error.response?.status

      // Only redirect for 404 and 500 errors
      if (shouldRedirectToErrorPage(status) && typeof window !== 'undefined') {
        const errorPage = status === 404 ? '/404' : '/500'
        Router.push(errorPage)
      }

      // Return error to allow component-level handling
      return Promise.reject(error)
    }
  )

  // Request interceptor - can be used for adding auth tokens, etc.
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add any default headers or modifications here
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}

/**
 * Create axios instance with error handling
 * Use this for services that need custom error handling
 */
export function createAxiosInstance(baseURL: string) {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add response interceptor to this instance
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status

      if (shouldRedirectToErrorPage(status) && typeof window !== 'undefined') {
        const errorPage = status === 404 ? '/404' : '/500'
        Router.push(errorPage)
      }

      return Promise.reject(error)
    }
  )

  return instance
}

