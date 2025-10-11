import AppError from "./appError";
import { Request, Response, NextFunction } from "express";

const sendErrorDev = (err: AppError | Error, res: Response) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const status = err instanceof AppError ? err.status : "error";

  res.status(statusCode).json({
    status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError | Error, res: Response) => {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export default (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const node_env = process.env.NODE_ENV!;
  if (node_env === "development") sendErrorDev(err, res);
  else if (node_env === "production") sendErrorProd(err, res);
};
