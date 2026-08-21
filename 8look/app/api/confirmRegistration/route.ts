import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

const searchPattern = /^[a-zA-Z0-9 -]{36}$/;

export async function POST()
{
    return NextResponse.json({error : 'Method not allowed'}, {status : 405})
}

export async function GET(request: NextRequest)
{
    const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';
    if(token && !searchPattern.test(token))
    {
        return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
 }

    const apiBaseUrl = getApiBaseUrl();
    const endpoint = `${apiBaseUrl}/registrationConfirm?token=${encodeURIComponent(token)}`
try{
    const response = await fetch(endpoint);

    if(!response.ok)
        {
            return NextResponse.json({ error: 'Cannot confirm registration.' }, { status: 502 })
        }

        return NextResponse.json({status: 200});
    }
    

catch{
    return NextResponse.json({ error: 'Cannot confirm registration.' }, { status: 500 })
}
}
