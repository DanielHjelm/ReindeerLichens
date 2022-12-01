// Imports
import express from "express";
import router from "./routes/images";
import inProgressRouter from "./routes/inProgress";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose from "mongoose";

// Create app
const app = express();

// Morgan
app.use(morgan("dev"));

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handle CORS errors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Route
app.use("/images", router);
app.use("/setInProgress", inProgressRouter);

app.use((req, res, next) => {
  const error = new CustomError(404, "Not found");
  next(error);
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({
    message: error.message,
  });
});

export default app;

// Class extending Error class for Typescript
export class CustomError extends Error {
  // status = 400;

  constructor(status: number, message: string) {
    super(message);

    // this.status = status;

    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  getErrorMessage() {
    return "Something went wrong: " + this.message;
  }
}
