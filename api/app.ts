// Imports
import express from "express";
import router from "./routes/images";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import mongodb from "mongodb";

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://admin:" +
    "hejhej" +
    "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority"
);

// Create app
const app = express();

// Morgon
app.use(morgan("dev"));

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handle CORS errors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Route
app.use("/images", router);

app.use((req, res, next) => {
  const error = new CustomError(404, "Not found");
  next(error);
});

app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(500).json({
      message: error.message,
    });
  }
);

export default app;

// Class extening Error class for Typescript
export class CustomError extends Error {
  status = 400;

  constructor(status: number, message: string) {
    super(message);

    this.status = status;

    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  getErrorMessage() {
    return "Something went wrong: " + this.message;
  }
}

interface ConnectOptions extends mongodb.MongoClientOptions {
  /** Set to false to [disable buffering](http://mongoosejs.com/docs/faq.html#callback_never_executes) on all models associated with this connection. */
  bufferCommands?: boolean;
  /** The name of the database you want to use. If not provided, Mongoose uses the database name from connection string. */
  dbName?: string;
  /** username for authentication, equivalent to `options.auth.user`. Maintained for backwards compatibility. */
  user?: string;
  /** password for authentication, equivalent to `options.auth.password`. Maintained for backwards compatibility. */
  pass?: string;
  /** Set to false to disable automatic index creation for all models associated with this connection. */
  autoIndex?: boolean;
  /** Set to `true` to make Mongoose automatically call `createCollection()` on every model created on this connection. */
  autoCreate?: boolean;
}
