
export class ApiError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // Operation errors like: bad input, not found.. are expected, which i think is safe to
    // show their message to the client. Non-operational (unexpected bugs)
    // should NOT leak their message to the client; see my errorHandler.ts.
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized.") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden.") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found.") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
