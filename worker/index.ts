import { route } from './route';

export default {
  async fetch(request, env) {
    let response: Response;
    try {
      const outcome = route(new URL(request.url));
      response =
        outcome.kind === 'redirect'
          ? Response.redirect(outcome.location, 301)
          : await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      response = new Response('Internal error', { status: 500 });
    }
    return withNoindex(response);
  },
} satisfies ExportedHandler<Env>;

// Nothing is indexed before publishing (S18, P7): every response carries the header, errors included.
function withNoindex(response: Response): Response {
  const headed = new Response(response.body, response);
  headed.headers.set('X-Robots-Tag', 'noindex');
  return headed;
}
