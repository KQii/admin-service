import { Request, Response } from "express";
import { oidcService } from "../services/oidcService";
import { catchAsync } from "../utils/catchAsync";

export const wellKnownController = {
  // OpenID Configuration endpoint
  getOpenIDConfiguration: catchAsync(async (req: Request, res: Response) => {
    const config = oidcService.getOpenIDConfiguration(req);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    res.status(200).json(config);
  }),

  // JWKS endpoint
  getJWKS: catchAsync(async (req: Request, res: Response) => {
    const jwks = oidcService.getJWKS();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    res.status(200).json(jwks);
  }),
};
