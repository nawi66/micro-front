import request from "supertest";
import type { App } from "supertest/types.js";
import { createApp } from "../app.js";

export const app = createApp() as unknown as App;

const DEFAULT_PASSWORD = "password12345";

export interface TestUser {
  accessToken: string;
  userId: string;
  email: string;
  cookies: string[];
}

/** Register + login a fresh user, returning tokens and the refresh cookie. */
export async function registerAndLogin(
  email: string,
  name = "Test User",
  password = DEFAULT_PASSWORD,
): Promise<TestUser> {
  await request(app).post("/auth/register").send({ email, password, name }).expect(201);
  const res = await request(app).post("/auth/login").send({ email, password }).expect(200);
  const setCookie = res.headers["set-cookie"];
  return {
    accessToken: res.body.accessToken as string,
    userId: res.body.user.id as string,
    email,
    cookies: Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [],
  };
}

/** Create a workspace as the given user; returns its id. */
export async function createWorkspace(token: string, name = "My Workspace"): Promise<string> {
  const res = await request(app)
    .post("/workspaces")
    .set("Authorization", `Bearer ${token}`)
    .send({ name })
    .expect(201);
  return res.body.workspace.id as string;
}

export { request, DEFAULT_PASSWORD };
