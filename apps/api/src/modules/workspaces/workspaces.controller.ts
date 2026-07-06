import type { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors.js";
import { workspacesService } from "./workspaces.service.js";

export const workspacesController = {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const ws = await workspacesService.create(req.userId, req.body.name);
    res.status(201).json({ workspace: ws });
  },

  async list(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const workspaces = await workspacesService.listForUser(req.userId);
    res.status(200).json({ workspaces });
  },

  async get(req: Request, res: Response): Promise<void> {
    const ws = await workspacesService.getForUser(req.workspaceId!, req.workspaceRole!);
    res.status(200).json({ workspace: ws });
  },

  async listMembers(req: Request, res: Response): Promise<void> {
    const members = await workspacesService.listMembers(req.workspaceId!);
    res.status(200).json({ members });
  },

  async addMember(req: Request, res: Response): Promise<void> {
    const member = await workspacesService.addMember(
      req.workspaceId!,
      req.body.email,
      req.body.role,
    );
    res.status(201).json({ member });
  },
};
