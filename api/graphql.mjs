import { yoga } from '../apps/api/dist/graphql/yoga.js';

function handler(request, response) {
  request.url = request.url?.replace(/^\/api\/graphql(?=\?|$)/, '/graphql');
  return yoga(request, response);
}

export default handler;
