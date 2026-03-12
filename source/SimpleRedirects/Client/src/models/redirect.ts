export interface Redirect {
  id: number;
  isRegex: boolean;
  oldUrl: string;
  newUrl: string;
  redirectCode: number;
  lastUpdated: string | null;
  notes: string;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface AddRedirectResponse extends BaseResponse {
  newRedirect: Redirect;
}

export interface UpdateRedirectResponse extends BaseResponse {
  updatedRedirect: Redirect;
}

export interface DeleteRedirectResponse extends BaseResponse {}

export interface ImportRedirectsResponse extends BaseResponse {
  addedRedirects: number;
  updatedRedirects: number;
  existingRedirects: number;
  errorRedirects: Redirect[];
}
