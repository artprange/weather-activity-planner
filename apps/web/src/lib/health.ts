import { z } from 'zod';

const healthResponseSchema = z.object({
  data: z.object({
    health: z.literal('ok'),
  }),
});

async function fetchHealth(signal: AbortSignal): Promise<'ok'> {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'query Health { health }',
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Unable to connect to the weather service.');
  }

  const body: unknown = await response.json();
  const result = healthResponseSchema.safeParse(body);

  if (!result.success) {
    throw new Error('The weather service returned an unexpected response.');
  }

  return result.data.data.health;
}

export { fetchHealth };
