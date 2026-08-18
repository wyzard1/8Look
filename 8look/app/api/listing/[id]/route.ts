import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "../../registration/route";

export type ApiListing =
{
    id: number;
    title: string;
    description: string;
    price: number;
    place: string;
    createdAt: string | null;
    updatedAt: string | null;
    categoryId: number;
    images: string[];
    sellerId: number;
    viewCount: number;
    seller?: {
        id: number;
        username: string;
        avatarUrl: string | null;
        lastLogin: string | null;
    } | null;
}

export async function POST()
{        
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}

export async function GET(  request: NextRequest,
  context: { params: Promise<{ id: string }> })
{
    const { id } = await context.params;

    if (!/^\d+$/.test(id))  
    {
    return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
    }

    const endpoint = `${getApiBaseUrl()}/listings/${id}`;

    try
    {
    const response = await fetch(endpoint, 
        {
            cache: 'no-store',
            headers: {Accept: "application/json"},
            signal: AbortSignal.timeout(8000),
        })

        if (response.status === 404) 
        {
        return NextResponse.json({ error: "Listing not found." }, { status: 404 });
        }

        if (!response.ok) 
        {
      return NextResponse.json({ error: 'Listing service unavailable.' }, { status: 502 });
        }

        const listing:ApiListing = await response.json();


    return NextResponse.json(listing, 
            {headers: 
        {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      }});
    }
    catch
    {
    return NextResponse.json({ error: "Listing service unavailable." }, { status: 502 });
    }


}
