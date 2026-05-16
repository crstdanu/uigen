import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { jwtVerify } from "jose";

interface SetCall {
  name: string;
  value: string;
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
    expires?: Date;
    path?: string;
  };
}

const setCalls: SetCall[] = [];

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: (name: string, value: string, options: SetCall["options"]) => {
      setCalls.push({ name, value, options });
    },
    delete: () => {},
  }),
}));

const { createSession } = await import("../auth");

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);

beforeEach(() => {
  setCalls.length = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("createSession writes a cookie named 'auth-token'", async () => {
  await createSession("user-123", "test@example.com");

  expect(setCalls).toHaveLength(1);
  expect(setCalls[0].name).toBe("auth-token");
  expect(typeof setCalls[0].value).toBe("string");
  expect(setCalls[0].value.length).toBeGreaterThan(0);
});

test("createSession cookie value is a JWT containing the userId and email", async () => {
  await createSession("user-abc", "alice@example.com");

  const token = setCalls[0].value;
  const { payload } = await jwtVerify(token, SECRET);

  expect(payload.userId).toBe("user-abc");
  expect(payload.email).toBe("alice@example.com");
});

test("createSession JWT has an expiresAt ~7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-1", "u@example.com");
  const after = Date.now();

  const token = setCalls[0].value;
  const { payload } = await jwtVerify(token, SECRET);

  const expiresAtMs = new Date(payload.expiresAt as string).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expiresAtMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expiresAtMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession JWT has 'exp' and 'iat' claims set", async () => {
  await createSession("user-2", "u2@example.com");

  const token = setCalls[0].value;
  const { payload } = await jwtVerify(token, SECRET);

  expect(typeof payload.exp).toBe("number");
  expect(typeof payload.iat).toBe("number");
  expect((payload.exp as number) > (payload.iat as number)).toBe(true);
});

test("createSession sets httpOnly, sameSite=lax, path=/, and an expires Date", async () => {
  await createSession("user-3", "u3@example.com");

  const opts = setCalls[0].options;
  expect(opts.httpOnly).toBe(true);
  expect(opts.sameSite).toBe("lax");
  expect(opts.path).toBe("/");
  expect(opts.expires).toBeInstanceOf(Date);
});

test("createSession cookie 'expires' option matches the JWT expiresAt", async () => {
  await createSession("user-4", "u4@example.com");

  const token = setCalls[0].value;
  const { payload } = await jwtVerify(token, SECRET);
  const jwtExpiresAt = new Date(payload.expiresAt as string).getTime();
  const cookieExpires = setCalls[0].options.expires!.getTime();

  expect(cookieExpires).toBe(jwtExpiresAt);
});

test("createSession sets secure: false when NODE_ENV is not production", async () => {
  vi.stubEnv("NODE_ENV", "development");

  await createSession("user-5", "u5@example.com");

  expect(setCalls[0].options.secure).toBe(false);
});

test("createSession sets secure: true when NODE_ENV is production", async () => {
  vi.stubEnv("NODE_ENV", "production");

  await createSession("user-6", "u6@example.com");

  expect(setCalls[0].options.secure).toBe(true);
});

test("createSession produces a token signed with the configured secret (wrong key fails)", async () => {
  await createSession("user-7", "u7@example.com");

  const token = setCalls[0].value;
  const wrongSecret = new TextEncoder().encode("not-the-right-secret");

  await expect(jwtVerify(token, wrongSecret)).rejects.toThrow();
});
