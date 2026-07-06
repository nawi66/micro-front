import { beforeEach, describe, expect, it } from "vitest";
import { app, createWorkspace, registerAndLogin, request, type TestUser } from "../../test/helpers.js";

const bearer = (t: string) => ["Authorization", `Bearer ${t}`] as const;

describe("docs (auth + tenancy + rbac)", () => {
  let alice: TestUser;
  let bob: TestUser;
  let wsA: string;

  beforeEach(async () => {
    alice = await registerAndLogin("alice@example.com", "Alice");
    bob = await registerAndLogin("bob@example.com", "Bob");
    wsA = await createWorkspace(alice.accessToken, "Alice WS");
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(app).get(`/workspaces/${wsA}/docs`).expect(401);
    await request(app).post(`/workspaces/${wsA}/docs`).send({ title: "x" }).expect(401);
  });

  it("rejects a non-member with 403 (cross-workspace isolation)", async () => {
    await request(app)
      .get(`/workspaces/${wsA}/docs`)
      .set(...bearer(bob.accessToken))
      .expect(403);
  });

  it("rejects an invalid body with 400", async () => {
    await request(app)
      .post(`/workspaces/${wsA}/docs`)
      .set(...bearer(alice.accessToken))
      .send({ title: "", nope: 1 })
      .expect(400);
  });

  it("runs the full doc lifecycle for a member", async () => {
    const created = await request(app)
      .post(`/workspaces/${wsA}/docs`)
      .set(...bearer(alice.accessToken))
      .send({ title: "Spec", content: "hello world" })
      .expect(201);
    const docId = created.body.doc.id as string;
    expect(created.body.doc.workspaceId).toBe(wsA);
    expect(created.body.doc.createdBy).toBe(alice.userId);
    expect(created.body.doc.updatedBy).toBe(alice.userId);

    const listed = await request(app)
      .get(`/workspaces/${wsA}/docs`)
      .set(...bearer(alice.accessToken))
      .expect(200);
    expect(listed.body.docs).toHaveLength(1);

    const updated = await request(app)
      .patch(`/workspaces/${wsA}/docs/${docId}`)
      .set(...bearer(alice.accessToken))
      .send({ content: "revised" })
      .expect(200);
    expect(updated.body.doc.content).toBe("revised");

    await request(app)
      .delete(`/workspaces/${wsA}/docs/${docId}`)
      .set(...bearer(alice.accessToken))
      .expect(204);

    await request(app)
      .get(`/workspaces/${wsA}/docs/${docId}`)
      .set(...bearer(alice.accessToken))
      .expect(404);
  });

  it("cannot read another workspace's doc by id (404, not leaked)", async () => {
    const created = await request(app)
      .post(`/workspaces/${wsA}/docs`)
      .set(...bearer(alice.accessToken))
      .send({ title: "secret", content: "top secret" })
      .expect(201);
    const docId = created.body.doc.id as string;
    const wsB = await createWorkspace(bob.accessToken, "Bob WS");

    await request(app)
      .get(`/workspaces/${wsB}/docs/${docId}`)
      .set(...bearer(bob.accessToken))
      .expect(404);
  });

  it("forbids a viewer from writing but allows reading (rbac)", async () => {
    await request(app)
      .post(`/workspaces/${wsA}/members`)
      .set(...bearer(alice.accessToken))
      .send({ email: "bob@example.com", role: "viewer" })
      .expect(201);

    await request(app)
      .get(`/workspaces/${wsA}/docs`)
      .set(...bearer(bob.accessToken))
      .expect(200);

    await request(app)
      .post(`/workspaces/${wsA}/docs`)
      .set(...bearer(bob.accessToken))
      .send({ title: "nope" })
      .expect(403);
  });

  it("rejects a malformed workspace id with 400", async () => {
    await request(app)
      .get(`/workspaces/not-an-objectid/docs`)
      .set(...bearer(alice.accessToken))
      .expect(400);
  });
});
