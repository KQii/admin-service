export interface AuthCode {
  user_id: string;
  client_id: string;
  redirect_uri: string;
  expires_at: number;
  state?: string;
}

export interface OAuth2TokenRequest {
  code: string;
  client_id: string;
  client_secret?: string;
  redirect_uri: string;
  grant_type: string;
  state?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface OAuth2ClientConfig {
  secret: string;
  redirectUris: string[];
}
