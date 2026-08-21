import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiUser, getApiBaseUrl, getBearerToken } from "@/lib/api";

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

        return NextResponse.json({
            ...userData,
            avatarUrl: userData.avatarUrl ?? userData.avatar_url ?? null,
            is_verified: userData.is_verified
                ?? userData.isVerified
                ?? userData.verified
                ?? userData.enabled
                ?? false,
        },
            {headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      }});
    }
    catch{
    return NextResponse.json({ error: "User service unavailable." }, { status: 502 });
    }
    
}
