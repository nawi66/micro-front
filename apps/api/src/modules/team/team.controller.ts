import type { Request, Response } from "express";
import { pathParam } from "../../lib/http.js";
import { teamService } from "./team.service.js";

export const teamController = {
  async list(req: Request, res: Response): Promise<void> {
    const members = await teamService.list(req.workspaceId!);
    res.status(200).json({ members });
  },

  async invite(req: Request, res: Response): Promise<void> {
    const member = await teamService.invite(req.workspaceId!, req.body);
    res.status(201).json({ member });
  },

  async changeRole(req: Request, res: Response): Promise<void> {
    const member = await teamService.changeRole(
      req.workspaceId!,
      pathParam(req, "memberId"),
      req.body.role,
    );
    res.status(200).json({ member });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await teamService.remove(req.workspaceId!, pathParam(req, "memberId"));
    res.status(204).send();
  },
};
