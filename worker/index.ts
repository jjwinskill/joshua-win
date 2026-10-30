import { handle } from './handler';

export default {
  fetch: (request, env) => handle(request, env.ASSETS),
} satisfies ExportedHandler<Env>;
