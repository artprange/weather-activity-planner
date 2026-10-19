import { z } from 'zod';

const graphQLResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

async function requestGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  dataSchema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
  });

  if (!response.ok) {
    throw new Error('Unable to connect to the weather service.');
  }

  const body: unknown = await response.json();
  const result = graphQLResponseSchema.safeParse(body);

  if (!result.success || (result.data.errors?.length ?? 0) > 0) {
    throw new Error('The weather service could not complete this request.');
  }

  const data = dataSchema.safeParse(result.data.data);

  if (!data.success) {
    throw new Error('The weather service returned an unexpected response.');
  }

  return data.data;
}

export { requestGraphQL };
