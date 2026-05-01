import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { assetPath } from "@/lib/assetPath";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  loaded: boolean;
  fetchMe: () => Promise<AuthUser | null>;
  login: (payload: { username: string; password: string }) => Promise<AuthUser>;
  register: (payload: { username: string; password: string; inviteCode: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      loaded: false,

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(assetPath("/api/auth/me"), {
            cache: "no-store",
            credentials: "include",
          });

          if (!response.ok) {
            const user = get().user;
            set({ loaded: true });
            return user;
          }

          const data = await response.json();
          const user = data?.user || null;
          set({ user, loaded: true });
          return user;
        } finally {
          set({ isLoading: false, loaded: true });
        }
      },

      login: async (payload) => {
        set({ isLoading: true });
        try {
          const response = await fetch(assetPath("/api/auth/login"), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(await readApiError(response, "登录失败"));
          }
          const data = await response.json();
          set({ user: data.user, loaded: true });
          return data.user;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const response = await fetch(assetPath("/api/auth/register"), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(await readApiError(response, "注册失败"));
          }
          const data = await response.json();
          set({ user: data.user, loaded: true });
          return data.user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await fetch(assetPath("/api/auth/logout"), {
          method: "POST",
          credentials: "include",
        });
        set({ user: null, loaded: true });
      },
    }),
    {
      name: "magic-resume-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        loaded: state.loaded,
      }),
    }
  )
);
