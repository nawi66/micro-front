import type { Request, Response } from "express";
import { adminService } from "./admin.service.js";

export const adminController = {
  async overview(req: Request, res: Response): Promise<void> {
    const overview = await adminService.overview(req.workspaceId!, req.workspaceRole!);
    res.status(200).json(overview);
  },

  async updateSettings(req: Request, res: Response): Promise<void> {
    const workspace = await adminService.updateSettings(
      req.workspaceId!,
      req.body,
      req.workspaceRole!,
    );
    res.status(200).json({ workspace });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await adminService.deleteWorkspace(req.workspaceId!);
    res.status(204).send();
  },
};
