enum ApplicationErrorCodeEnum {
  INVALID_INPUT = 'INVALID_INPUT',
  UPSTREAM_UNAVAILABLE = 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_INVALID_RESPONSE = 'UPSTREAM_INVALID_RESPONSE',
}

class ApplicationError extends Error {
  readonly code: ApplicationErrorCodeEnum;

  constructor(
    code: ApplicationErrorCodeEnum,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = 'ApplicationError';
    this.code = code;
  }
}

export { ApplicationErrorCodeEnum, ApplicationError };
