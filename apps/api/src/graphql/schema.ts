import { createSchema } from 'graphql-yoga';

const typeDefs = /* GraphQL */ `
  type Query {
    health: String!
  }
`;

const resolvers = {
  Query: {
    health: (): string => 'ok',
  },
};

const schema = createSchema({
  typeDefs,
  resolvers,
});

export { schema };
