import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { userService } from "../services/userService";
import AppError from "../middlewares/appError";
import {
  getPaginationOptions,
  parseQueryParams,
  QueryResult,
} from "../utils/apiFeatures";

interface QueryParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export const userController = {
  getAllUsers: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { page, limit } = getPaginationOptions(req.query);
      const filters = parseQueryParams(req.query);

      const result = await userService.getAllUsers(filters, page, limit);

      res.status(200).json({
        status: "success",
        ...result,
      });
    }
  ),

  getUser: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.getUserById(req.params.id);

      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    }
  ),

  getUserWithOAuth2: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.getUserById(req.user.id);

      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      res.status(200).json({
        sub: user.id,
        preferred_username: user.username,
        email: user.email,
        name: user.full_name,
        roles: user.roles,
      });
    }
  ),
};
