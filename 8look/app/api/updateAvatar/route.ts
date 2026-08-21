import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiBaseUrl, getBearerToken } from "@/lib/api";

export async function GET() {
  return NextResponse.json({ message: 'This endpoint is for updating the avatar. Please use a POST request.' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = getBearerToken(request, cookieStore.get('authToken')?.value);
    const apiBaseUrl = getApiBaseUrl();

    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to update your avatar.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0 || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid avatar file.' }, { status: 400 });
    }

    const forwardedFormData = new FormData();
    forwardedFormData.append("file", file, file.name);

    const uploadResponse = await fetch(`${apiBaseUrl}/updateAvatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: forwardedFormData,
      signal: AbortSignal.timeout(30000),
    });

    if (!uploadResponse.ok) {
      return NextResponse.json({ error: 'Failed to update avatar.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Avatar updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
