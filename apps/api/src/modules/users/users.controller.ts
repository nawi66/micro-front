import type { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors.js";
import { usersService } from "./users.service.js";

export const usersController = {
  async me(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const user = await usersService.getProfile(req.userId);
    res.status(200).json({ user });
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const user = await usersService.updateProfile(req.userId, req.body);
    res.status(200).json({ user });
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    await usersService.changePassword(req.userId, req.body);
    // Every session was revoked — 204, client must re-authenticate.
    res.status(204).send();
  },
};
