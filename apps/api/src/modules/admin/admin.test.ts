import { beforeEach, describe, expect, it } from "vitest";
import { app, createWorkspace, registerAndLogin, request, type TestUser } from "../../test/helpers.js";

const bearer = (t: string) => ["Authorization", `Bearer ${t}`] as const;

async function addMember(token: string, wsId: string, email: string, role: string) {
  await request(app)
    .post(`/workspaces/${wsId}/members`)
    .set("Authorization", `Bearer ${token}`)
    .send({ email, role })
    .expect(201);
}

describe("admin (auth + tenancy + rbac)", () => {
  let alice: TestUser; // owner
  let bob: TestUser;
  let wsA: string;

  beforeEach(async () => {
    alice = await registerAndLogin("alice@example.com", "Alice");
    bob = await registerAndLogin("bob@example.com", "Bob");
    wsA = await createWorkspace(alice.accessToken, "Alice WS");
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(app).get(`/workspaces/${wsA}/admin/overview`).expect(401);
  });

  it("forbids a plain member from the admin surface (403)", async () => {
    await addMember(alice.accessToken, wsA, "bob@example.com", "member");
    await request(app)
      .get(`/workspaces/${wsA}/admin/overview`)
      .set(...bearer(bob.accessToken))
      .expect(403);
  });

  it("returns an overview with resource counts", async () => {
    await request(app)
      .post(`/workspaces/${wsA}/tasks`)
      .set(...bearer(alice.accessToken))
      .send({ title: "T1" })
      .expect(201);
    await request(app)
      .post(`/workspaces/${wsA}/docs`)
      .set(...bearer(alice.accessToken))
      .send({ title: "D1", content: "x" })
      .expect(201);

    const res = await request(app)
      .get(`/workspaces/${wsA}/admin/overview`)
      .set(...bearer(alice.accessToken))
      .expect(200);
    expect(res.body.workspace.id).toBe(wsA);
    expect(res.body.counts).toEqual({ members: 1, tasks: 1, docs: 1 });
  });

  it("updates workspace settings", async () => {
    const res = await request(app)
      .patch(`/workspaces/${wsA}/admin/settings`)
      .set(...bearer(alice.accessToken))
      .send({ name: "Renamed WS" })
      .expect(200);
    expect(res.body.workspace.name).toBe("Renamed WS");
  });

  it("rejects an empty settings update with 400", async () => {
    await request(app)
      .patch(`/workspaces/${wsA}/admin/settings`)
      .set(...bearer(alice.accessToken))
      .send({})
      .expect(400);
  });

  it("forbids an admin (non-owner) from deleting the workspace (403)", async () => {
    await addMember(alice.accessToken, wsA, "bob@example.com", "admin");
    await request(app)
      .delete(`/workspaces/${wsA}/admin`)
      .set(...bearer(bob.accessToken))
      .expect(403);
  });

  it("deletes the workspace and cascades its resources (owner only)", async () => {
    await request(app)
      .post(`/workspaces/${wsA}/tasks`)
      .set(...bearer(alice.accessToken))
      .send({ title: "T1" })
      .expect(201);
    await request(app)
      .post(`/workspaces/${wsA}/docs`)
      .set(...bearer(alice.accessToken))
      .send({ title: "D1", content: "x" })
      .expect(201);

    await request(app)
      .delete(`/workspaces/${wsA}/admin`)
      .set(...bearer(alice.accessToken))
      .expect(204);

    // Membership is gone → the tenant guard now denies access (403).
    await request(app)
      .get(`/workspaces/${wsA}/admin/overview`)
      .set(...bearer(alice.accessToken))
      .expect(403);
  });
});
