import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  activeId: string | null;
  setActive: (id: string) => void;
}

/**
 * The active workspace id. The shell owns selection and passes the id down to
 * each MFE as a prop — MFEs never fetch the workspace list themselves.
 * Persisted so the selection survives a refresh.
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeId: null,
      setActive: (activeId) => set({ activeId }),
    }),
    {
      name: "pulse-workspace",
      partialize: (s) => ({ activeId: s.activeId }),
    },
  ),
);
