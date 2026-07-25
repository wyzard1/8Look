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
    id: number;
    email: string;
    username: string;
    avatar_url?: string;
    last_login: Date | null;
}

function getBearerToken(request: NextRequest, cookieToken?: string) {
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }

    return cookieToken;
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}

export async function GET(request: NextRequest)
{
    const cookieStore = await cookies();
    const apiBaseUrl = getApiBaseUrl();
    const endpoint = `${apiBaseUrl}/me`;
    const token = getBearerToken(request, cookieStore.get("authToken")?.value);

    if (!token) {
        return NextResponse.json({ error: "No auth token found." }, { status: 403 });
    }

    try{
    const response = await fetch(endpoint, 
        {
            cache: 'no-store',
            headers: {Accept: "application/json", Authorization: `Bearer ${token}` }
        })

        if(!response.ok)
            {
                return NextResponse.json({ error: 'Unable to get user data.' }, { status: response.status })
            }
    
            const userData: ApiUser = await response.json();

        return NextResponse.json(userData, 
            {headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      }});
    }
    catch{
    return NextResponse.json({ error: "User service unavailable." }, { status: 502 });
    }
    
}
