export type Route =
  | '/login'
  | '/signup'
  | '/dashboard'
  | '/products'
  | '/sales'
  | '/grns'
  | '/grns/create'
  | '/wallets'
  | '/inventory'
  | '/customers'
  | '/suppliers';

export function navigate(route: Route) {
  window.history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function readRoute(): Route {
  const path = window.location.pathname;

  if (
    path === '/signup' ||
    path === '/dashboard' ||
    path === '/products' ||
    path === '/sales' ||
    path === '/grns' ||
    path === '/grns/create' ||
    path === '/wallets' ||
    path === '/inventory' ||
    path === '/customers' ||
    path === '/suppliers'
  ) {
    return path as Route;
  }

  return '/login';
}
