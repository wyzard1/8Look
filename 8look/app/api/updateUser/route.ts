import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ApiUser, getApiBaseUrl, getBearerToken } from "@/lib/api";

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = getBearerToken(request, cookieStore.get("authToken")?.value);

  if (!authToken) {
    return NextResponse.json({ error: 'You must be logged in to update your account.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current_password = body.current_password;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phoneNumber = typeof body.phoneNumber === 'string'
      ? body.phoneNumber.trim()
      : typeof body.phone_number === 'string'
        ? body.phone_number.trim()
        : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username && !email && !phoneNumber && !password) {
      return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });
    }

    const response = await fetch(`${getApiBaseUrl()}/updateUser`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        current_password,
        username,
        email,
        password,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const error = typeof payload?.error === 'string'
        ? payload.error
        : response.status === 403
          ? 'Current password is incorrect.'
          : 'Unable to update account.';

      return NextResponse.json({ error }, { status: response.status });
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
    { headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return NextResponse.json({ error: 'An error occurred while updating the user.' }, { status: 500 });
  }
}
