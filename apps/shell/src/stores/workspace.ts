import { create } from "zustand";

interface WorkspaceStore {
  activeId: string | null;
  setActive: (id: string) => void;
}

/**
 * The active workspace id. The shell owns selection and passes the id down to
 * each MFE as a prop — MFEs never fetch the workspace list themselves.
 */
export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  activeId: null,
  setActive: (activeId) => set({ activeId }),
}));