const { verifyPassword, setSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const password = String(body?.password || "");

    if (!verifyPassword(password)) {
      res.status(401).json({ error: "Wrong password" });
      return;
    }

    setSessionCookie(res);
    res.status(200).json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
};
