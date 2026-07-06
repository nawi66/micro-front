import type { Request, Response } from "express";
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from "../../lib/cookies.js";
import { UnauthorizedError } from "../../lib/errors.js";
import { authService, type IssuedTokens } from "./auth.service.js";

/** Shape the token envelope sent in the body — never includes the refresh token. */
function tokenBody(issued: IssuedTokens) {
  return { accessToken: issued.accessToken, expiresIn: issued.expiresIn, user: issued.user };
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const user = await authService.register(req.body);
    res.status(201).json({ user });
  },

  async login(req: Request, res: Response): Promise<void> {
    const issued = await authService.login(req.body);
    setRefreshCookie(res, issued.refreshToken, issued.refreshTokenTtlMs);
    res.status(200).json(tokenBody(issued));
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw new UnauthorizedError("Missing refresh token");
    const issued = await authService.refresh(raw);
    setRefreshCookie(res, issued.refreshToken, issued.refreshTokenTtlMs);
    res.status(200).json(tokenBody(issued));
  },

  async logout(req: Request, res: Response): Promise<void> {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await authService.logout(raw);
    clearRefreshCookie(res);
    res.status(204).send();
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const user = await authService.getUserById(req.userId);
    res.status(200).json({ user });
  },
};
