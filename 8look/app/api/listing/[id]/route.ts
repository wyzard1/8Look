import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, getBearerToken } from "@/lib/api";
import type { ApiListing, ListingDetails } from "@/lib/listings";

type ApiUser = {
  id?: unknown;
};

type ApiUserListingsResponse = {
  listings?: unknown;
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxImageCount = 8;
const maxImageSize = 5 * 1024 * 1024;

function isValidListingId(id: string) {
  return /^\d+$/.test(id);
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function getAuthenticatedUserId(request: NextRequest) {
  const cookieStore = await cookies();
  const token = getBearerToken(request, cookieStore.get("authToken")?.value);

  if (!token) {
    return { token: null, userId: null };
  }

  const response = await fetch(`${getApiBaseUrl()}/me`, {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    return { token: null, userId: null };
  }

  const user = (await response.json().catch(() => null)) as ApiUser | null;
  const userId = Number(user?.id);

  return {
    token,
    userId: Number.isInteger(userId) ? userId : null,
  };
}

export async function POST()
{        
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}

export async function GET(  request: NextRequest,
  context: { params: Promise<{ id: string }> })
{
    const { id } = await context.params;

    if (!isValidListingId(id))  
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

        const listing: ListingDetails = await response.json();


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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!isValidListingId(id)) {
    return noStoreJson({ error: "Invalid listing id." }, { status: 400 });
  }

  try {
    const { token } = await getAuthenticatedUserId(request);

    if (!token) {
      return noStoreJson({ error: "You must be logged in to edit this listing." }, { status: 401 });
    }

    const incomingFormData = await request.formData();
    const listing: Record<string, unknown> = {};
    const title = String(incomingFormData.get("title") ?? "").trim();
    const description = String(incomingFormData.get("description") ?? "").trim();
    const place = String(incomingFormData.get("place") ?? "").trim();
    const rawPrice = String(incomingFormData.get("price") ?? "").trim();
    const imageUrls = [
      ...incomingFormData.getAll("image_urls"),
      ...incomingFormData.getAll("images"),
    ].filter((image): image is string => typeof image === "string" && image.trim().length > 0);

    if (title) listing.title = title;
    if (incomingFormData.has("description")) listing.description = description;
    if (place) listing.place = place;

    if (rawPrice) {
      const price = Number(rawPrice);

      if (!Number.isFinite(price) || price <= 0) {
        return noStoreJson({ error: "Enter a valid price." }, { status: 400 });
      }

      listing.price = price;
    }

    if (imageUrls.length > 0 || incomingFormData.has("image_urls") || incomingFormData.has("images")) {
      listing.image_urls = imageUrls;
    }

    const files = incomingFormData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
    const totalImageCount = imageUrls.length + files.length;

    if (totalImageCount > maxImageCount) {
      return noStoreJson({ error: `Keep up to ${maxImageCount} photos on a listing.` }, { status: 400 });
    }

    for (const file of files) {
      if (!allowedImageTypes.has(file.type) || file.size > maxImageSize) {
        return noStoreJson({ error: "Photos must be JPG, PNG, WebP, or GIF files under 5 MB." }, { status: 400 });
      }
    }

    const formData = new FormData();
    formData.append("listing", new Blob([JSON.stringify(listing)], { type: "application/json" }));

    for (const file of files) {
      formData.append("files", file, file.name);
    }

    const response = await fetch(`${getApiBaseUrl()}/listings/edit/${id}`, {
      method: "PATCH",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (response.status === 401) {
      return noStoreJson({ error: "You must be logged in to edit this listing." }, { status: 401 });
    }

    if (response.status === 403) {
      return noStoreJson({ error: "You can only edit your own listings." }, { status: 403 });
    }

    if (response.status === 404) {
      return noStoreJson({ error: "Listing not found." }, { status: 404 });
    }

    if (!response.ok) {
      return noStoreJson({ error: "Listing could not be updated." }, { status: response.status });
    }

    const listingDetails: ListingDetails = await response.json();
    return noStoreJson(listingDetails);
  } catch (error) {
    console.error("Listing update proxy failed:", error);
    return noStoreJson({ error: "Listing service unavailable." }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!isValidListingId(id)) {
    return noStoreJson({ error: "Invalid listing id." }, { status: 400 });
  }

  try {
    const { token, userId } = await getAuthenticatedUserId(request);

    if (!token || userId === null) {
      return noStoreJson({ error: "You must be logged in to delete this listing." }, { status: 401 });
    }

    const listingResponse = await fetch(`${getApiBaseUrl()}/listings/user/${userId}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!listingResponse.ok) {
      return noStoreJson({ error: "Listing service unavailable." }, { status: 502 });
    }

    const userListings = (await listingResponse.json().catch(() => null)) as ApiUserListingsResponse | null;
    const listings = Array.isArray(userListings?.listings) ? userListings.listings : [];
    const ownsListing = listings.some((listing) => {
      const candidate = listing as ApiListing;
      return candidate.id === Number(id);
    });

    if (!ownsListing) {
      return noStoreJson({ error: "You can only delete your own listings." }, { status: 403 });
    }

    const response = await fetch(`${getApiBaseUrl()}/listings/delete/${id}`, {
      method: "DELETE",
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 404) {
      return noStoreJson({ error: "Listing not found." }, { status: 404 });
    }

    if (!response.ok) {
      return noStoreJson({ error: "Listing could not be deleted." }, { status: response.status });
    }

    return noStoreJson({ message: "Listing deleted successfully." });
  } catch (error) {
    console.error("Listing delete proxy failed:", error);
    return noStoreJson({ error: "Listing service unavailable." }, { status: 502 });
  }
}
