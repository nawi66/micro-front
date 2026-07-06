import { beforeEach, describe, expect, it } from "vitest";
import { app, createWorkspace, registerAndLogin, request, type TestUser } from "../../test/helpers.js";

const bearer = (t: string) => ["Authorization", `Bearer ${t}`] as const;

/** Add a member and return their membership id. */
async function invite(token: string, wsId: string, email: string, role = "member") {
  const res = await request(app)
    .post(`/workspaces/${wsId}/team`)
    .set("Authorization", `Bearer ${token}`)
    .send({ email, role })
    .expect(201);
  return res.body.member.id as string;
}

describe("team (auth + tenancy + rbac)", () => {
  let alice: TestUser; // owner
  let bob: TestUser;
  let carol: TestUser;
  let wsA: string;

  beforeEach(async () => {
    alice = await registerAndLogin("alice@example.com", "Alice");
    bob = await registerAndLogin("bob@example.com", "Bob");
    carol = await registerAndLogin("carol@example.com", "Carol");
    wsA = await createWorkspace(alice.accessToken, "Alice WS");
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(app).get(`/workspaces/${wsA}/team`).expect(401);
  });

  it("rejects a non-member with 403 (cross-workspace isolation)", async () => {
    await request(app)
      .get(`/workspaces/${wsA}/team`)
      .set(...bearer(bob.accessToken))
      .expect(403);
  });

  it("rejects an invalid invite body with 400", async () => {
    await request(app)
      .post(`/workspaces/${wsA}/team`)
      .set(...bearer(alice.accessToken))
      .send({ email: "not-an-email", role: "owner" })
      .expect(400);
  });

  it("lists the roster enriched with user profiles", async () => {
    await invite(alice.accessToken, wsA, "bob@example.com", "admin");
    const res = await request(app)
      .get(`/workspaces/${wsA}/team`)
      .set(...bearer(alice.accessToken))
      .expect(200);

    expect(res.body.members).toHaveLength(2);
    const bobRow = res.body.members.find((m: { email: string }) => m.email === "bob@example.com");
    expect(bobRow.name).toBe("Bob");
    expect(bobRow.role).toBe("admin");
  });

  it("lets an admin change a member's role but forbids a member from managing", async () => {
    const bobId = await invite(alice.accessToken, wsA, "bob@example.com", "member");

    // A plain member cannot manage the team.
    await request(app)
      .patch(`/workspaces/${wsA}/team/${bobId}`)
      .set(...bearer(bob.accessToken))
      .send({ role: "admin" })
      .expect(403);

    // The owner can.
    const res = await request(app)
      .patch(`/workspaces/${wsA}/team/${bobId}`)
      .set(...bearer(alice.accessToken))
      .send({ role: "viewer" })
      .expect(200);
    expect(res.body.member.role).toBe("viewer");
  });

  it("removes a member", async () => {
    const carolId = await invite(alice.accessToken, wsA, "carol@example.com", "member");
    await request(app)
      .delete(`/workspaces/${wsA}/team/${carolId}`)
      .set(...bearer(alice.accessToken))
      .expect(204);

    const res = await request(app)
      .get(`/workspaces/${wsA}/team`)
      .set(...bearer(alice.accessToken))
      .expect(200);
    expect(res.body.members).toHaveLength(1);
  });

  it("refuses to remove the sole owner (403)", async () => {
    const roster = await request(app)
      .get(`/workspaces/${wsA}/team`)
      .set(...bearer(alice.accessToken))
      .expect(200);
    const ownerId = roster.body.members[0].id as string;

    await request(app)
      .delete(`/workspaces/${wsA}/team/${ownerId}`)
      .set(...bearer(alice.accessToken))
      .expect(403);
  });

  it("cannot manage a member from another workspace (404)", async () => {
    const bobId = await invite(alice.accessToken, wsA, "bob@example.com", "member");
    const wsC = await createWorkspace(carol.accessToken, "Carol WS");

    // Carol references Alice's membership id via HER workspace — tenant-scoped → 404.
    await request(app)
      .delete(`/workspaces/${wsC}/team/${bobId}`)
      .set(...bearer(carol.accessToken))
      .expect(404);
  });
});
