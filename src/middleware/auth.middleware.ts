import { Response, NextFunction } from "express";
import { AuthRequest, UserRole } from "../types/auth.types.js";
import { auth0Service } from "../services/auth0.service.js";
import { dbService } from "../services/database.service.js";

export const syncOrCreateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authPayload = req.auth?.payload;

    //console.log("Auth payload:", authPayload);

    if (!authPayload?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const auth0Id = authPayload.sub;
    const auth0User = await auth0Service.getUserInfo(auth0Id);

    let role: UserRole = "Client";

    if (auth0User.app_metadata?.role) {
      role = auth0User.app_metadata.role as UserRole;
    } else if (authPayload["https://api.yourapp.com/roles"]?.includes("Admin")) {
      role = "Admin";
    }

    const dbUser = await dbService.createOrUpdateUser(
      auth0Id,
      auth0User.email,
      auth0User.name || auth0User.nickname || null,
      role,
      auth0User.user_metadata || {}
    );

    console.log("User synced:", dbUser);

    req.user = dbUser;
    next();
  } catch (error) {
    console.error("syncOrCreateUser error:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
};
