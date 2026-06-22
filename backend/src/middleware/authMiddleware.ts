import { readDatabase } from "../utils/dbLocal.js";

export const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing Bearer Token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const db = readDatabase();

    if (token.startsWith("user-token-")) {
      const username = token.replace("user-token-", "");
      const user = db.users.find((u) => u.username === username);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: Active User not found" });
      }
      req.user = user;
      return next();
    }

    if (!token.startsWith("at-mock::")) {
      throw new Error("Invalid token format");
    }
    const parts = token.split("::");
    if (parts.length < 3) {
      return res.status(401).json({ error: "Unauthorized: Invalid Token signature" });
    }
    const userId = parts[1];
    const expiry = Number(parts[2]);
    
    if (Date.now() > expiry) {
      return res.status(401).json({ error: "Unauthorized: Access token has expired", isExpired: true });
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Active User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Token Signature mismatch" });
  }
};
