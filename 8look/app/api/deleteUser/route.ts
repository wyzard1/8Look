import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "../listings/route";
import { getApiBaseUrl } from "../registration/route";

export async function GET() {
  return NextResponse.json({ message: 'This endpoint is for deleting the user. Please use a DELETE request.' }, { status: 405 });
}

export async function POST() {
  return NextResponse.json({ message: 'This endpoint is for deleting the user. Please use a DELETE request.' }, { status: 405 });
}

export async function DELETE(request: NextRequest){
try{
    const cookieStore = await cookies();
    const token = getBearerToken(request, cookieStore.get('authToken')?.value)
    const apiBaseUrl = getApiBaseUrl();

    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to delete your account.' }, { status: 401 });
    }

    const userResponse = await fetch(`${apiBaseUrl}/me`, {
      cache: 'no-store',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'You must be logged in to delete your account.' }, { status: 401 });
    }

    const response = await fetch(`${apiBaseUrl}/deleteUser`, 
        {
            method: 'DELETE',
            cache: 'no-store',
            headers: {Accept: "application/json", Authorization: `Bearer ${token}` }
        })

        if(!response.ok)
            {
                return NextResponse.json({ error: 'Unable to delete user.' }, { status: response.status })
            }
    
        return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });
}
catch{
    return NextResponse.json({ error: 'User service unavailable.' }, { status: 502 });
}
}
