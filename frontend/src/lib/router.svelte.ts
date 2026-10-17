import type { Route } from '$lib/types';

const ROUTES: Route[] = ['login', 'beranda', 'scan', 'bbm', 'sukses', 'riwayat'];

function current(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return (ROUTES as string[]).includes(raw) ? (raw as Route) : 'login';
}

/**
 * Hash router (no dependency, no server rewrite rules needed).
 * ponytail: swap for svelte-routing when nested routes or params are required.
 */
export const router = $state<{ route: Route }>({ route: current() });

window.addEventListener('hashchange', () => {
  router.route = current();
  window.scrollTo({ top: 0 });
});

export function go(route: Route): void {
  if (window.location.hash !== `#/${route}`) {
    window.location.hash = `#/${route}`;
  }
  router.route = route;
}
