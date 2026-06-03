/**
 * Standardized API response format for all endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(
  message: string,
  data?: T,
  meta?: ApiResponse["meta"]
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

export function errorResponse(
  message: string,
  errors?: Array<{ field?: string; message: string }>
): ApiResponse {
  return {
    success: false,
    message,
    errors: errors || [{ message }],
  };
}

export function validationErrorResponse(
  errors: Array<{ field: string; message: string }>
): ApiResponse {
  return {
    success: false,
    message: "Validation failed",
    errors,
  };
}

export function unauthorizedResponse(message = "Unauthorized"): ApiResponse {
  return {
    success: false,
    message,
    errors: [{ message }],
  };
}

export function notFoundResponse(resource = "Resource"): ApiResponse {
  return {
    success: false,
    message: `${resource} not found`,
    errors: [{ message: `${resource} not found` }],
  };
}