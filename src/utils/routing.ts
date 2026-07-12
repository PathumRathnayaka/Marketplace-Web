export type Route =
  | '/login'
  | '/signup'
  | '/dashboard'
  | '/pos'
  | '/products'
  | '/sales'
  | '/returns'
  | '/grns'
  | '/grns/create'
  | '/grns/order'
  | '/grns/delivery'
  | '/grns/detail'
  | '/wallets'
  | '/inventory'
  | '/customers'
  | '/suppliers'
  | '/supplier-market'
  | '/shop-profile'
  | '/settings';

export function navigate(route: Route) {
  window.history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateToGrn(id: string) {
  window.history.pushState({}, '', `/grns/${id}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// Sub-pages of /grns that are pages in their own right, not a GRN id.
const GRN_SUBPAGES = ['/grns/create', '/grns/order', '/grns/delivery'];

export function getGrnDetailId(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/grns\/([^/]+)$/);
  if (match && !GRN_SUBPAGES.includes(path)) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

export function readRoute(): Route {
  const path = window.location.pathname;

  if (/^\/grns\/[^/]+$/.test(path) && !GRN_SUBPAGES.includes(path)) {
    return '/grns/detail';
  }

  if (
    path === '/signup' ||
    path === '/dashboard' ||
    path === '/pos' ||
    path === '/products' ||
    path === '/sales' ||
    path === '/returns' ||
    path === '/grns' ||
    path === '/grns/create' ||
    path === '/grns/order' ||
    path === '/grns/delivery' ||
    path === '/wallets' ||
    path === '/inventory' ||
    path === '/customers' ||
    path === '/suppliers' ||
    path === '/supplier-market' ||
    path === '/shop-profile' ||
    path === '/settings'
  ) {
    return path as Route;
  }

  return '/login';
}
