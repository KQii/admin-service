import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import wellKnownRouter from "./routes/wellKnownRoutes";
import authRouter from "./routes/authRoutes";
import oAuth2Router from "./routes/oAuth2Routes";
import userRouter from "./routes/userRoutes";
import roleRouter from "./routes/roleRoutes";
import AppError from "./middlewares/appError";
import globalErrorHandler from "./middlewares/errorController";

const app = express();

app.set("trust proxy", 1);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/.well-known", wellKnownRouter);

app.use("/api/v1/auth", authRouter);
app.use("/oauth2", oAuth2Router);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/roles", roleRouter);

app.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "ok", service: "Admin Service" });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
