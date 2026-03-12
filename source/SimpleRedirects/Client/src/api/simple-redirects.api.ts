import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import type { UmbClassInterface } from '@umbraco-cms/backoffice/class-api';
import type {
  Redirect,
  AddRedirectResponse,
  UpdateRedirectResponse,
  DeleteRedirectResponse,
  ImportRedirectsResponse,
} from '../models/redirect.js';

const API_BASE = '/umbraco/management/api/v1/simple-redirects';

async function getAuthHeaders(host: UmbClassInterface): Promise<HeadersInit> {
  const authContext = await host.getContext(UMB_AUTH_CONTEXT);
  const token = await authContext?.getLatestToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function authFetch(host: UmbClassInterface, url: string, init?: RequestInit): Promise<Response> {
  const authContext = await host.getContext(UMB_AUTH_CONTEXT);
  const token = await authContext?.getLatestToken();
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

export async function getAllRedirects(host: UmbClassInterface): Promise<Redirect[]> {
  const headers = await getAuthHeaders(host);
  const response = await fetch(`${API_BASE}/redirects`, { headers, credentials: 'include' });
  return response.json();
}

export async function addRedirect(
  host: UmbClassInterface,
  redirect: { isRegex: boolean; oldUrl: string; newUrl: string; redirectCode: number; notes: string }
): Promise<AddRedirectResponse> {
  const headers = await getAuthHeaders(host);
  const response = await fetch(`${API_BASE}/redirect`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(redirect),
  });
  return response.json();
}

export async function updateRedirect(
  host: UmbClassInterface,
  redirect: Redirect
): Promise<UpdateRedirectResponse> {
  const headers = await getAuthHeaders(host);
  const response = await fetch(`${API_BASE}/redirect`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ redirect }),
  });
  return response.json();
}

export async function deleteRedirect(
  host: UmbClassInterface,
  id: number
): Promise<DeleteRedirectResponse> {
  const headers = await getAuthHeaders(host);
  const response = await fetch(`${API_BASE}/redirect/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  return response.json();
}

export async function deleteAllRedirects(
  host: UmbClassInterface
): Promise<DeleteRedirectResponse> {
  const headers = await getAuthHeaders(host);
  const response = await fetch(`${API_BASE}/redirects`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  return response.json();
}

export async function clearCache(host: UmbClassInterface): Promise<void> {
  const headers = await getAuthHeaders(host);
  await fetch(`${API_BASE}/cache/clear`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
}

export function getExportUrl(dataRecordProvider: 'Csv' | 'Excel'): string {
  return `${API_BASE}/redirects/export?dataRecordProvider=${dataRecordProvider}`;
}

export async function exportRedirects(
  host: UmbClassInterface,
  dataRecordProvider: 'Csv' | 'Excel'
): Promise<void> {
  const authContext = await host.getContext(UMB_AUTH_CONTEXT);
  const token = await authContext?.getLatestToken();

  const response = await fetch(getExportUrl(dataRecordProvider), {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: dataRecordProvider === 'Csv' ? 'text/csv' : 'application/vnd.ms-excel',
    },
  });

  if (!response.ok) return;

  const blob = await response.blob();
  if (blob.size === 0) return;

  const filename = `SimpleRedirects-Export.${dataRecordProvider === 'Csv' ? 'csv' : 'xlsx'}`;
  const url = window.URL.createObjectURL(blob);

  // Create anchor outside the DOM to avoid Umbraco's SPA router intercepting the click
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => window.URL.revokeObjectURL(url), 5000);
}

export async function importRedirects(
  host: UmbClassInterface,
  file: File,
  overwriteMatches: boolean
): Promise<ImportRedirectsResponse> {
  const authContext = await host.getContext(UMB_AUTH_CONTEXT);
  const token = await authContext?.getLatestToken();

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/redirects/import?overwriteMatches=${overwriteMatches}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return response.json();
}
