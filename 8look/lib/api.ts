import { NextRequest } from 'next/server';

export type ApiUser = {
  id: number;
  email: string;
  username: string;
  phone_number?: string | null;
  avatar_url?: string;
  avatarUrl?: string;
  last_login: Date | null;
  is_verified?: boolean;
  isVerified?: boolean;
  verified?: boolean;
  enabled?: boolean;
};

export function getApiBaseUrl() {
  const configuredUrl = process.env.SPRING_API_URL ?? process.env.API_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const host = process.env.API_HOST ?? 'localhost';
  const port = process.env.API_PORT ?? '8080';
  return `http://${host}:${port}`;
}

export function getBearerToken(request: NextRequest, cookieToken?: string) {
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return cookieToken;
}
