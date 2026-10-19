import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationErrorCodeEnum } from '../src/errors/applicationError.js';
import { fetchOpenMeteoJson } from '../src/integrations/open-meteo/openMeteoClient.js';

const fetchMock = vi.fn<typeof fetch>();
const requestUrl = new URL(
  'https://geocoding-api.open-meteo.com/v1/search?name=Santos',
);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchOpenMeteoJson', () => {
  it.each([429, 500, 503])(
    'reports HTTP %i as unavailable rather than empty data',
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response('Private upstream details', { status }),
      );
      await expect(fetchOpenMeteoJson(requestUrl)).rejects.toMatchObject({
        code: ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
        message: 'The weather data service could not complete the request.',
      });
    },
  );

  it('preserves the network cause without exposing it in the public message', async () => {
    const cause = new TypeError('Private network details');
    fetchMock.mockRejectedValue(cause);
    await expect(fetchOpenMeteoJson(requestUrl)).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
      message: 'The weather data service is temporarily unavailable.',
      cause,
    });
  });

  it('rejects invalid JSON and preserves its parsing cause', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Not JSON</html>'));
    await expect(fetchOpenMeteoJson(requestUrl)).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      cause: expect.any(SyntaxError),
    });
  });

  it('aborts a request that has not returned headers', async () => {
    const controller = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal);
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    );

    const assertion = expect(
      fetchOpenMeteoJson(requestUrl),
    ).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
      message: 'The weather data service took too long to respond.',
    });
    expect(timeoutSpy).toHaveBeenCalledWith(8_000);
    controller.abort(new DOMException('Timed out', 'TimeoutError'));
    await assertion;
  });

  it('retains the deadline while consuming the response body', async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    let rejectBody: (reason?: unknown) => void = () => {
      throw new Error('Body was not started.');
    };
    const bodyStarted = new Promise<void>((resolveStarted) => {
      const response = new Response();
      vi.spyOn(response, 'json').mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectBody = reject;
            resolveStarted();
          }),
      );
      fetchMock.mockResolvedValue(response);
    });

    const assertion = expect(
      fetchOpenMeteoJson(requestUrl),
    ).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
      message: 'The weather data service took too long to respond.',
    });
    await bodyStarted;
    const cause = new DOMException('Timed out', 'TimeoutError');
    controller.abort(cause);
    rejectBody(cause);
    await assertion;
  });
});
