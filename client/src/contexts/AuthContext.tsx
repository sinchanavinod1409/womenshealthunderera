import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { trpc } from "@/lib/trpc";
export type SafeUser = {
  id: number;
  username: string | null;
  name: string | null;
  preferredLanguage: string;
};
const AuthContext = createContext<{ user: SafeUser | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const query = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  return (
    <AuthContext.Provider
      value={{ user: query.data ?? null, loading: query.isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
