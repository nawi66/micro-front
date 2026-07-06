import type { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors.js";
import { pathParam } from "../../lib/http.js";
import { tasksService } from "./tasks.service.js";
import type { ListTasksQuery } from "./tasks.schema.js";

export const tasksController = {
  async list(req: Request, res: Response): Promise<void> {
    const tasks = await tasksService.list(
      req.workspaceId!,
      req.query as unknown as ListTasksQuery,
    );
    res.status(200).json({ tasks });
  },

  async create(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new UnauthorizedError();
    const task = await tasksService.create(req.workspaceId!, req.userId, req.body);
    res.status(201).json({ task });
  },

  async get(req: Request, res: Response): Promise<void> {
    const task = await tasksService.get(req.workspaceId!, pathParam(req, "taskId"));
    res.status(200).json({ task });
  },

  async update(req: Request, res: Response): Promise<void> {
    const task = await tasksService.update(req.workspaceId!, pathParam(req, "taskId"), req.body);
    res.status(200).json({ task });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await tasksService.remove(req.workspaceId!, pathParam(req, "taskId"));
    res.status(204).send();
  },
};
