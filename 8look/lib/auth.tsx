
'use client';

import React from "react";

export type User = 
{
  id: number;
  email: string;
  username: string;
  last_login: string | null;
  is_verified: boolean;
  avatarUrl: string | null;
}

type AuthContextValue = {
  user: User | null;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  const refreshUser = React.useCallback(async () => {
    setIsLoadingUser(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsLoadingUser(false);
  }, []);

  React.useEffect(() => {
    let ignore = false;

    getCurrentUser().then((currentUser) => {
      if (ignore) return;

      setUser(currentUser);
      setIsLoadingUser(false);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    isLoadingUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
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
