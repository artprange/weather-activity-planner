import { createYoga } from 'graphql-yoga';

import { createGraphQLContext } from './context.js';
import { schema } from './schema.js';

const yoga = createYoga({
  schema,
  context: createGraphQLContext,
  graphqlEndpoint: '/graphql',
  cors: false,
  maskedErrors: {
    isDev: false,
  },
});

export { yoga };
