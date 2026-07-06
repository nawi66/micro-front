/** Error thrown for any non-2xx API response. Carries the parsed error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    opts?: { requestId?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = opts?.requestId;
    this.details = opts?.details;
  }
}