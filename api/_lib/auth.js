const crypto = require("crypto");

const ADMIN_COOKIE = "ld_admin_session";

function getSecret() {
  return process.env.ADMIN_PASSWORD || "ldspices2026";
}

function createSessionToken() {
  return crypto.createHmac("sha256", getSecret()).update("ld-admin-ok").digest("hex");
}

function verifySessionToken(token) {
  if (!token) return false;
  try {
    const expected = Buffer.from(createSessionToken(), "utf8");
    const actual = Buffer.from(token, "utf8");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function verifyPassword(password) {
  const expected = getSecret();
  try {
    const a = Buffer.from(password, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return password === expected;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) out[key] = decodeURIComponent(rest.join("="));
  });
  return out;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[ADMIN_COOKIE]);
}

function setSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${createSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${secure ? "; Secure" : ""}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

module.exports = {
  ADMIN_COOKIE,
  createSessionToken,
  verifySessionToken,
  verifyPassword,
  isAuthenticated,
  setSessionCookie,
  clearSessionCookie,
};
