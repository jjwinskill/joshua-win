import { route } from './route';

// What the Worker needs from its ASSETS binding; a stand-in satisfies it in unit tests.
export interface Assets {
  fetch(request: Request): Promise<Response>;
}

export async function handle(request: Request, assets: Assets): Promise<Response> {
  let response: Response;
  try {
    const outcome = route(new URL(request.url));
    response =
      outcome.kind === 'redirect'
        ? Response.redirect(outcome.location, 301)
        : await assets.fetch(request);
  } catch (error) {
    console.error(error);
    response = new Response('Internal error', { status: 500 });
  }
  return withLongCache(request, withNoindex(response));
}

// Astro puts a hash of each file's content in its name, so these never change. Cached outright, the
// router needn't wait on a round trip for a stylesheet it already has.
function withLongCache(request: Request, response: Response): Response {
  if (response.status === 200 && new URL(request.url).pathname.startsWith('/skill/_astro/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  return response;
}

// Nothing is indexed before publishing (S18, P7): every response the Worker returns carries the
// header, errors included. Responses the platform itself returns (limits, crashes) can't; see #6.
function withNoindex(response: Response): Response {
  const headed = new Response(response.body, response);
  headed.headers.set('X-Robots-Tag', 'noindex');
  return headed;
}
