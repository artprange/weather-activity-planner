import { createSchema } from 'graphql-yoga';

import type { GraphQLContextType } from './context.js';
import type { Resolvers } from './generated.js';
import { resolveSafely } from './resolveSafely.js';
import { typeDefs } from './typeDefs.js';

const resolvers = {
  Query: {
    health: (): string => 'ok',

    searchPlaces: (_parent, args, context) =>
      resolveSafely(
        () => context.searchPlaces(args.query),
        context.reportError,
      ),

    activityForecast: (_parent, args, context) =>
      resolveSafely(
        () => context.getActivityForecast(args.placeId),
        context.reportError,
      ),
  },

  EvaluationWindow: {
    startAt: (window) => new Date(window.startMs).toISOString(),

    endAt: (window) => new Date(window.endMs).toISOString(),
  },
} satisfies Resolvers<GraphQLContextType>;

const schema = createSchema<GraphQLContextType>({
  typeDefs,
  resolvers,
});

export { schema };
