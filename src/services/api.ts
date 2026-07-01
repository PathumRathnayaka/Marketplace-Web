import { ApiResponse, LoginData, RegisterOwnerPayload } from '../types/auth';
import { env } from '../config/env';
import { Customer, Grn, Product, ProductQuantityBatch, ProductReturn, Sale, Supplier, Wallet } from '../types/pos';

const AUTH_STORAGE_KEY = 'qalpos.auth';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export function getStoredAuth(): LoginData | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LoginData;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeAuth(data: LoginData) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = getStoredAuth();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && auth?.accessToken) {
    headers.set('Authorization', `${auth.tokenType || 'Bearer'} ${auth.accessToken}`);
  }

  if (options.auth !== false && auth?.user.tenantId) {
    headers.set('X-Tenant-Id', auth.user.tenantId);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const authApi = {
  requestRegistrationOtp(email: string) {
    return request<ApiResponse<unknown>>('/api/auth/request-registration-otp', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email }),
    });
  },

  verifyRegistrationOtp(email: string, otp: string) {
    return request<ApiResponse<string>>('/api/auth/verify-registration-otp', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, otp }),
    });
  },

  registerOwner(payload: RegisterOwnerPayload) {
    return request<ApiResponse<unknown>>('/api/auth/register-owner', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(payload),
    });
  },

  login(email: string, password: string) {
    return request<ApiResponse<LoginData>>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  },
};

export const productApi = {
  list: () => requestList<Product>('/api/pos/api/v1/products'),
  get: (id: string) => requestOne<Product>(`/api/pos/api/v1/products/${id}`),
  create: (data: Partial<Product>) =>
    request<ApiResponse<Product>>('/api/pos/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const productVariationApi = {
  list: () => requestList<any>('/api/pos/api/v1/product-variations'),
  get: (id: string) => requestOne<any>(`/api/pos/api/v1/product-variations/${id}`),
  create: (data: any) =>
    request<ApiResponse<any>>('/api/pos/api/v1/product-variations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const salesApi = {
  list: () => requestList<Sale>('/api/pos/api/v1/sales'),
  get: (id: string) => requestOne<Sale>(`/api/pos/api/v1/sales/${id}`),
  create: (data: Partial<Sale>) =>
    request<ApiResponse<Sale>>('/api/pos/api/v1/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Sale>) =>
    request<ApiResponse<Sale>>(`/api/pos/api/v1/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const productReturnApi = {
  list: () => requestList<ProductReturn>('/api/pos/api/v1/product-returns'),
  create: (data: Partial<ProductReturn>) =>
    request<ApiResponse<ProductReturn>>('/api/pos/api/v1/product-returns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ProductReturn>) =>
    request<ApiResponse<ProductReturn>>(`/api/pos/api/v1/product-returns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const grnApi = {
  list: () => requestList<Grn>('/api/pos/api/v1/grns'),
  get: (id: string) => requestOne<Grn>(`/api/pos/api/v1/grns/${id}`),
  create: (data: Partial<Grn>) =>
    request<ApiResponse<Grn>>('/api/pos/api/v1/grns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createPayment: (data: any) =>
    request<ApiResponse<any>>('/api/pos/api/v1/grn-payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const walletApi = {
  list: () => requestList<Wallet>('/api/pos/api/v1/wallets'),
  get: (id: string) => requestOne<Wallet>(`/api/pos/api/v1/wallets/${id}`),
  create: (data: Partial<Wallet>) =>
    request<ApiResponse<Wallet>>('/api/pos/api/v1/wallets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Wallet>) =>
    request<ApiResponse<Wallet>>(`/api/pos/api/v1/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const inventoryApi = {
  listBatches: () => requestList<ProductQuantityBatch>('/api/pos/api/v1/product-quantity-batches'),
  createBatch: (data: any) =>
    request<ApiResponse<any>>('/api/pos/api/v1/product-quantity-batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBatch: (id: string, data: Partial<ProductQuantityBatch>) =>
    request<ApiResponse<ProductQuantityBatch>>(`/api/pos/api/v1/product-quantity-batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const customerApi = {
  list: () => requestList<Customer>('/api/pos/api/v1/customers'),
  get: (id: string) => requestOne<Customer>(`/api/pos/api/v1/customers/${id}`),
  create: (data: Partial<Customer>) =>
    request<ApiResponse<Customer>>('/api/pos/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const supplierApi = {
  list: () => requestList<Supplier>('/api/pos/api/v1/suppliers'),
  get: (id: string) => requestOne<Supplier>(`/api/pos/api/v1/suppliers/${id}`),
  create: (data: Partial<Supplier>) =>
    request<ApiResponse<Supplier>>('/api/pos/api/v1/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

async function requestList<T>(path: string) {
  const response = await request<ApiResponse<T[]> | T[]>(path);
  return Array.isArray(response) ? response : response.data || [];
}

async function requestOne<T>(path: string) {
  const response = await request<ApiResponse<T> | T>(path);
  return isApiResponse<T>(response) ? response.data : response;
}

function isApiResponse<T>(value: ApiResponse<T> | T): value is ApiResponse<T> {
  return Boolean(value && typeof value === 'object' && 'data' in value);
}
