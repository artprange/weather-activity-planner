import { yoga } from '../apps/api/dist/graphql/yoga.js';

function handler(request, response) {
  // Support both the public rewrite and the function's direct URL.
  request.url = request.url?.replace(/^\/api\/graphql(?=\?|$)/, '/graphql');
  return yoga(request, response);
}

export default handler;
