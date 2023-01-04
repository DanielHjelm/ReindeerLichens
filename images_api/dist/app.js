"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
// Imports
const express_1 = __importDefault(require("express"));
const images_1 = __importDefault(require("./routes/images"));
const inProgress_1 = __importDefault(require("./routes/inProgress"));
const star_1 = __importDefault(require("./routes/star"));
const isViewed_1 = __importDefault(require("./routes/isViewed"));
const threshold_1 = __importDefault(require("./routes/threshold"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
// Create app
const app = (0, express_1.default)();
// Morgan
app.use((0, morgan_1.default)("dev"));
// Body Parser
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
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
app.use("/images", images_1.default);
app.use("/setInProgress", inProgress_1.default);
app.use("/star", star_1.default);
app.use("/isViewed", isViewed_1.default);
app.use("/threshold", threshold_1.default);
app.use((req, res, next) => {
    const error = new CustomError(404, "Not found");
    next(error);
});
// Error handling
app.use((error, req, res, next) => {
    res.status(500).json({
        message: error.message,
    });
});
exports.default = app;
// Class extending Error class for Typescript
class CustomError extends Error {
    // status = 400;
    constructor(status, message) {
        super(message);
        // this.status = status;
        // 👇️ because we are extending a built-in class
        Object.setPrototypeOf(this, CustomError.prototype);
    }
    getErrorMessage() {
        return "Something went wrong: " + this.message;
    }
}
exports.CustomError = CustomError;
