import { createGraphQLError } from 'graphql-yoga';

import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../errors/applicationError.js';

const PublicErrorMessages: Record<ApplicationErrorCodeEnum, string> = {
  [ApplicationErrorCodeEnum.INVALID_INPUT]:
    'Check the search text or selected place.',
  [ApplicationErrorCodeEnum.PLACE_NOT_FOUND]:
    'The selected place was not found.',
  [ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE]:
    'The weather data service is temporarily unavailable.',
  [ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE]:
    'The weather data service returned an unexpected response.',
};

async function resolveSafely<T>(
  operation: () => Promise<T>,
  reportError: (error: unknown) => void,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof ApplicationError) {
      if (
        error.code !== ApplicationErrorCodeEnum.INVALID_INPUT &&
        error.code !== ApplicationErrorCodeEnum.PLACE_NOT_FOUND
      ) {
        reportError(error);
      }

      throw createGraphQLError(PublicErrorMessages[error.code], {
        extensions: {
          code: error.code,
        },
      });
    }

    reportError(error);

    throw createGraphQLError('Unable to complete the request.', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

export { resolveSafely };
