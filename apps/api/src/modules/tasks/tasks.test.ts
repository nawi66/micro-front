import { beforeEach, describe, expect, it } from "vitest";
import { app, createWorkspace, registerAndLogin, request, type TestUser } from "../../test/helpers.js";

const bearer = (t: string) => ["Authorization", `Bearer ${t}`] as const;

describe("tasks (auth + tenancy + rbac)", () => {
  let alice: TestUser;
  let bob: TestUser;
  let wsA: string;

  beforeEach(async () => {
    alice = await registerAndLogin("alice@example.com", "Alice");
    bob = await registerAndLogin("bob@example.com", "Bob");
    wsA = await createWorkspace(alice.accessToken, "Alice WS");
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(app).get(`/workspaces/${wsA}/tasks`).expect(401);
    await request(app).post(`/workspaces/${wsA}/tasks`).send({ title: "x" }).expect(401);
  });

  it("rejects a non-member with 403 (cross-workspace isolation)", async () => {
    await request(app)
      .get(`/workspaces/${wsA}/tasks`)
      .set(...bearer(bob.accessToken))
      .expect(403);
  });

  it("rejects an invalid body with 400", async () => {
    await request(app)
      .post(`/workspaces/${wsA}/tasks`)
      .set(...bearer(alice.accessToken))
      .send({ title: "", nope: 1 })
      .expect(400);
  });

  it("runs the full task lifecycle for a member", async () => {
    const created = await request(app)
      .post(`/workspaces/${wsA}/tasks`)
      .set(...bearer(alice.accessToken))
      .send({ title: "Ship it", priority: "high" })
      .expect(201);
    const taskId = created.body.task.id as string;
    expect(created.body.task.workspaceId).toBe(wsA);
    expect(created.body.task.status).toBe("todo");

    const listed = await request(app)
      .get(`/workspaces/${wsA}/tasks`)
      .set(...bearer(alice.accessToken))
      .expect(200);
    expect(listed.body.tasks).toHaveLength(1);

    const updated = await request(app)
      .patch(`/workspaces/${wsA}/tasks/${taskId}`)
      .set(...bearer(alice.accessToken))
      .send({ status: "done" })
      .expect(200);
    expect(updated.body.task.status).toBe("done");

    await request(app)
      .delete(`/workspaces/${wsA}/tasks/${taskId}`)
      .set(...bearer(alice.accessToken))
      .expect(204);

    await request(app)
      .get(`/workspaces/${wsA}/tasks/${taskId}`)
      .set(...bearer(alice.accessToken))
      .expect(404);
  });

  it("cannot read another workspace's task by id (404, not leaked)", async () => {
    const created = await request(app)
      .post(`/workspaces/${wsA}/tasks`)
      .set(...bearer(alice.accessToken))
      .send({ title: "secret" })
      .expect(201);
    const taskId = created.body.task.id as string;
    const wsB = await createWorkspace(bob.accessToken, "Bob WS");

    // Bob asks for Alice's task via HIS workspace — the query is tenant-scoped, so 404.
    await request(app)
      .get(`/workspaces/${wsB}/tasks/${taskId}`)
      .set(...bearer(bob.accessToken))
      .expect(404);
  });

  it("forbids a viewer from writing but allows reading (rbac)", async () => {
    // Alice adds Bob as a viewer.
    await request(app)
      .post(`/workspaces/${wsA}/members`)
      .set(...bearer(alice.accessToken))
      .send({ email: "bob@example.com", role: "viewer" })
      .expect(201);

    await request(app)
      .get(`/workspaces/${wsA}/tasks`)
      .set(...bearer(bob.accessToken))
      .expect(200);

    await request(app)
      .post(`/workspaces/${wsA}/tasks`)
      .set(...bearer(bob.accessToken))
      .send({ title: "nope" })
      .expect(403);
  });

  it("rejects a malformed workspace id with 400", async () => {
    await request(app)
      .get(`/workspaces/not-an-objectid/tasks`)
      .set(...bearer(alice.accessToken))
      .expect(400);
  });
});
