import { beforeEach, describe, expect, it } from "vitest";
import { app, registerAndLogin, request, DEFAULT_PASSWORD, type TestUser } from "../../test/helpers.js";

const bearer = (t: string) => ["Authorization", `Bearer ${t}`] as const;

describe("users (profile + credentials)", () => {
  let alice: TestUser;

  beforeEach(async () => {
    alice = await registerAndLogin("alice@example.com", "Alice");
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(app).get("/users/me").expect(401);
    await request(app).patch("/users/me").send({ name: "X" }).expect(401);
    await request(app).post("/users/me/password").send({}).expect(401);
  });

  it("returns the current profile", async () => {
    const res = await request(app)
      .get("/users/me")
      .set(...bearer(alice.accessToken))
      .expect(200);
    expect(res.body.user.id).toBe(alice.userId);
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects an invalid / empty profile update with 400", async () => {
    await request(app)
      .patch("/users/me")
      .set(...bearer(alice.accessToken))
      .send({ name: "", nope: 1 })
      .expect(400);
    await request(app)
      .patch("/users/me")
      .set(...bearer(alice.accessToken))
      .send({})
      .expect(400);
  });

  it("updates the profile name", async () => {
    const res = await request(app)
      .patch("/users/me")
      .set(...bearer(alice.accessToken))
      .send({ name: "Alice Cooper" })
      .expect(200);
    expect(res.body.user.name).toBe("Alice Cooper");
  });

  it("rejects a password change with the wrong current password (401)", async () => {
    await request(app)
      .post("/users/me/password")
      .set(...bearer(alice.accessToken))
      .send({ currentPassword: "wrong-password", newPassword: "newpassword12345" })
      .expect(401);
  });

  it("rejects a too-short new password with 400", async () => {
    await request(app)
      .post("/users/me/password")
      .set(...bearer(alice.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: "short" })
      .expect(400);
  });

  it("changes the password and revokes existing sessions", async () => {
    await request(app)
      .post("/users/me/password")
      .set(...bearer(alice.accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: "brandnewpassword123" })
      .expect(204);

    // The old refresh cookie is now revoked → refresh fails.
    await request(app)
      .post("/auth/refresh")
      .set("Cookie", alice.cookies)
      .expect(401);

    // Login works with the new password.
    await request(app)
      .post("/auth/login")
      .send({ email: "alice@example.com", password: "brandnewpassword123" })
      .expect(200);
  });
});
