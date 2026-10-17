import { createServer } from 'node:http';

import { createYoga } from 'graphql-yoga';
import { z } from 'zod';

import { schema } from './graphql/schema.js';

const ServerConstants = {
	DEFAULT_PORT: 4000,
	HOST: '127.0.0.1',
	GRAPHQL_ENDPOINT: '/graphql',
};

const environmentSchema = z.object({
	PORT: z.coerce
		.number()
		.int()
		.min(1)
		.max(65535)
		.default(ServerConstants.DEFAULT_PORT),
});

const environment = environmentSchema.parse(process.env);

const yoga = createYoga({
	schema,
	graphqlEndpoint: ServerConstants.GRAPHQL_ENDPOINT,
	cors: false,
});

const server = createServer(yoga);

server.on('error', (error: Error): void => {
	console.error('Failed to start API server', error);
	process.exitCode = 1;
});

server.listen(environment.PORT, ServerConstants.HOST, (): void => {
	console.info(
		`API ready at http://${ServerConstants.HOST}:${environment.PORT}${ServerConstants.GRAPHQL_ENDPOINT}`,
	);
});
