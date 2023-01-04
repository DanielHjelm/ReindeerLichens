"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./db"));
dotenv_1.default.config();
(0, db_1.default)();
const port = process.env.PORT;
// const server = http.createServer(app);
app_1.default.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
// // Connect to MongoDB
// mongoose.connect(
//   "mongodb+srv://admin:" +
//     "hejhej" +
//     "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority"
// );
