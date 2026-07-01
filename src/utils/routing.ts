export type Route =
  | '/login'
  | '/signup'
  | '/dashboard'
  | '/pos'
  | '/refund'
  | '/products'
  | '/sales'
  | '/grns'
  | '/grns/create'
  | '/grns/detail'
  | '/wallets'
  | '/inventory'
  | '/customers'
  | '/suppliers';

export function navigate(route: Route) {
  window.history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateToGrn(id: string) {
  window.history.pushState({}, '', `/grns/${id}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function getGrnDetailId(): string | null {
  const match = window.location.pathname.match(/^\/grns\/([^/]+)$/);
  if (match && match[1] !== 'create') {
    return decodeURIComponent(match[1]);
  }
  return null;
}

export function readRoute(): Route {
  const path = window.location.pathname;

  if (/^\/grns\/[^/]+$/.test(path) && path !== '/grns/create') {
    return '/grns/detail';
  }

  if (
    path === '/signup' ||
    path === '/dashboard' ||
    path === '/pos' ||
    path === '/refund' ||
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
