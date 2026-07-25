
export type User = 
{
  id: number;
  email: string;
  username: string;
  last_login: string | null;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<User | null>
{
    const response = await fetch("/api/me",
        {
            cache: "no-store"
        });

        if(!response.ok) return null;

        return response.json() as Promise<User>;
}
