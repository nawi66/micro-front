import type { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors.js";
import { pathParam } from "../../lib/http.js";
import { docsService } from "./docs.service.js";
import type { ListDocsQuery } from "./docs.schema.js";

export const docsController = {
  async list(req: Request, res: Response): Promise<void> {
    const docs = await docsService.list(
      req.workspaceId!,
      req.query as unknown as ListDocsQuery,
    );
    res.status(200).json({ docs });
  },

  async create(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const doc = await docsService.create(req.workspaceId!, req.userId, req.body);
    res.status(201).json({ doc });
  },

  async get(req: Request, res: Response): Promise<void> {
    const doc = await docsService.get(req.workspaceId!, pathParam(req, "docId"));
    res.status(200).json({ doc });
  },

  async update(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const doc = await docsService.update(
      req.workspaceId!,
      pathParam(req, "docId"),
      req.userId,
      req.body,
    );
    res.status(200).json({ doc });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await docsService.remove(req.workspaceId!, pathParam(req, "docId"));
    res.status(204).send();
  },
};
