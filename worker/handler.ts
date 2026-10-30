import { decideGate, type GateSettings } from './gate';
import { BASE_PATH, route } from './route';

// What the Worker needs from its ASSETS binding; a stand-in satisfies it in unit tests.
export interface Assets {
  fetch(request: Request): Promise<Response>;
}

export async function handle(
  request: Request,
  assets: Assets,
  settings: GateSettings,
): Promise<Response> {
  let response: Response;
  try {
    response = await respond(request, assets, settings);
  } catch (error) {
    // Fails closed: a bug here, in the gate included, is a 500, never the assets.
    console.error(error);
    response = new Response('Internal error', { status: 500 });
  }
  return withNoindex(response);
}

async function respond(
  request: Request,
  assets: Assets,
  settings: GateSettings,
): Promise<Response> {
  const url = new URL(request.url);

  // Redirects run before the gate: they reveal nothing, and the gate only ever sees the final URL.
  const outcome = route(url);
  if (outcome.kind === 'redirect') return Response.redirect(outcome.location, 301);

  const decision = await decideGate(url, request.headers.get('Cookie'), settings);
  switch (decision.kind) {
    case 'open':
      return assets.fetch(request);
    case 'member':
      return withCacheControl(await assets.fetch(request), 'private, no-cache');
    case 'admit':
      // A 302, not a 301: a browser must never remember this redirect.
      return new Response(null, {
        status: 302,
        headers: {
          Location: decision.location,
          'Set-Cookie': decision.setCookie,
          'Cache-Control': 'no-store',
        },
      });
    case 'placeholder':
      return placeholder(request, url, assets);
  }
}

// Always a plain 200 from the built placeholder page, so no response reveals that a gate exists.
async function placeholder(request: Request, url: URL, assets: Assets): Promise<Response> {
  const page = await assets.fetch(
    new Request(new URL(`${BASE_PATH}placeholder/`, url), {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    }),
  );
  if (!page.ok) throw new Error(`The placeholder page is missing: ${page.status}`);
  const response = withCacheControl(page, 'no-store');
  response.headers.delete('ETag');
  return response;
}

// While the gate is on, no shared cache may keep a page or serve the placeholder in its place.
function withCacheControl(response: Response, value: string): Response {
  const headed = new Response(response.body, response);
  headed.headers.set('Cache-Control', value);
  return headed;
}

// Nothing is indexed before publishing (S18, P7): every response the Worker returns carries the
// header, errors included. Responses the platform itself returns (limits, crashes) can't; see #6.
function withNoindex(response: Response): Response {
  const headed = new Response(response.body, response);
  headed.headers.set('X-Robots-Tag', 'noindex');
  return headed;
}
