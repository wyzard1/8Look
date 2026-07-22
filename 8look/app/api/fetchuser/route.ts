import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";



function getApiBaseUrl() {
  const configuredUrl = process.env.SPRING_API_URL ?? process.env.API_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const host = process.env.API_HOST ?? 'localhost';
  const port = process.env.API_PORT ?? '8080';
  return `http://${host}:${port}`;
}

type ApiUser =
{
    userid: number;
    email: string;
    username: string;
    avatar_url?: string;
    last_login: Date | null;
}


export async function POST() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}

export async function GET(request: NextRequest)
{
    const cookieStore = await cookies();
    const apiBaseUrl = getApiBaseUrl();
    if(!cookieStore.has('authToken'))
        {
            return NextResponse.json({error: "Not logged in"}, {status: 404})
        }

    const jwt = cookieStore.get('authToken');

}