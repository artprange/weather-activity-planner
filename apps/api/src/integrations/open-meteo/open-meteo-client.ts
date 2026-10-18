import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../../errors/application-error.js';

const OpenMeteoClientConstants = {
  TIMEOUT_MS: 8_000,
};

async function fetchOpenMeteoJson(url: URL): Promise<unknown> {
  const signal = AbortSignal.timeout(OpenMeteoClientConstants.TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (cause: unknown) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
      signal.aborted
        ? 'The weather data service took too long to respond.'
        : 'The weather data service is temporarily unavailable.',
      { cause },
    );
  }

  if (!response.ok) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
      'The weather data service could not complete the request.',
    );
  }

  try {
    const body: unknown = await response.json();
    return body;
  } catch (cause: unknown) {
    if (signal.aborted) {
      throw new ApplicationError(
        ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
        'The weather data service took too long to respond.',
        { cause },
      );
    }

    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      'The weather data service returned an invalid response.',
      { cause },
    );
  }
}

export { fetchOpenMeteoJson };
