import { handle } from './handler';

export default {
  fetch: (request, env) =>
    handle(request, env.ASSETS, { mode: env.GATE, secret: env.INVITE_SECRET }),
} satisfies ExportedHandler<Env>;
