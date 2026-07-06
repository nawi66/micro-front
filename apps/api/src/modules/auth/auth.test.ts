import { describe, expect, it } from "vitest";
import { app, DEFAULT_PASSWORD, registerAndLogin, request } from "../../test/helpers.js";
import { REFRESH_COOKIE } from "../../lib/cookies.js";

describe("auth", () => {
  it("registers a user and returns a sanitized DTO (no hash)", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@example.com", password: DEFAULT_PASSWORD, name: "Ada" })
      .expect(201);
    expect(res.body.user.email).toBe("a@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a weak/invalid body with 400", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "short", name: "" })
      .expect(400);
  });

  it("rejects unknown fields (strict schema)", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "b@example.com", password: DEFAULT_PASSWORD, name: "Bo", admin: true })
      .expect(400);
  });

  it("logs in with a refresh cookie and access token", async () => {
    const user = await registerAndLogin("c@example.com");
    expect(user.accessToken).toBeTruthy();
    expect(user.cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`))).toBe(true);
    // Refresh cookie must be HttpOnly + scoped to /auth.
    const rt = user.cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=`))!;
    expect(rt).toMatch(/HttpOnly/i);
    expect(rt).toMatch(/Path=\/auth/i);
    expect(rt).toMatch(/SameSite=Strict/i);
  });

  it("returns a generic 401 on wrong password (no user enumeration)", async () => {
    await registerAndLogin("d@example.com");
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "d@example.com", password: "wrong-password-xx" })
      .expect(401);
    expect(res.body.error).toBe("unauthorized");
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("locks the account after 10 failed attempts (still generic 401)", async () => {
    await registerAndLogin("e@example.com");
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post("/auth/login")
        .send({ email: "e@example.com", password: "wrong-password-xx" })
        .expect(401);
    }
    // Correct password now also fails — locked, but the response never says so.
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "e@example.com", password: DEFAULT_PASSWORD })
      .expect(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("rotates the refresh token and issues a new access token", async () => {
    const user = await registerAndLogin("f@example.com");
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", user.cookies)
      .expect(200);
    expect(res.body.accessToken).toBeTruthy();
    const newCookie = res.headers["set-cookie"];
    expect(newCookie).toBeDefined();
  });

  it("detects refresh-token reuse and kills the family", async () => {
    const user = await registerAndLogin("g@example.com");
    // First refresh rotates the token (old one is now revoked).
    await request(app).post("/auth/refresh").set("Cookie", user.cookies).expect(200);
    // Replaying the original (now-revoked) token → reuse detected → 401.
    const reuse = await request(app)
      .post("/auth/refresh")
      .set("Cookie", user.cookies)
      .expect(401);
    expect(reuse.body.error).toBe("unauthorized");
  });

  it("GET /auth/me requires a bearer token", async () => {
    await request(app).get("/auth/me").expect(401);
    const user = await registerAndLogin("h@example.com");
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(200);
    expect(res.body.user.email).toBe("h@example.com");
  });

  it("logout revokes the refresh token", async () => {
    const user = await registerAndLogin("i@example.com");
    await request(app).post("/auth/logout").set("Cookie", user.cookies).expect(204);
    // The revoked token can no longer refresh.
    await request(app).post("/auth/refresh").set("Cookie", user.cookies).expect(401);
  });
});
