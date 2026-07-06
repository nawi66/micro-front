/**
 * Type declarations for federated remote modules. Each MFE exposes a default
 * React component from its bootstrap that accepts the active workspace id.
 */
declare module "tasks/App" {
  import type { ComponentType } from "react";
  const TasksApp: ComponentType<{ workspaceId: string }>;
  export default TasksApp;
}

declare module "dashboard/App" {
  import type { ComponentType } from "react";
  const DashboardApp: ComponentType<{ workspaceId: string }>;
  export default DashboardApp;
}

declare module "docs/App" {
  import type { ComponentType } from "react";
  const DocsApp: ComponentType<{ workspaceId: string }>;
  export default DocsApp;
}

declare module "team/App" {
  import type { ComponentType } from "react";
  const TeamApp: ComponentType<{ workspaceId: string }>;
  export default TeamApp;
}

declare module "admin/App" {
  import type { ComponentType } from "react";
  const AdminApp: ComponentType<{ workspaceId: string }>;
  export default AdminApp;
}