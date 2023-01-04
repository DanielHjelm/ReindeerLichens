"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const router = express_1.default.Router();
let client = new mongodb_1.MongoClient("mongodb://localhost:27017", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
exports.client = client;
let db = client.db("ReindeerLichens");
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST request to /setInProgress");
    if (!req.body.fileName || !req.body.status) {
        return res.status(400).json({ message: "Please provide a file name and status" });
    }
    let name = req.body.fileName;
    let status = req.body.status == "true";
    if (name.includes("_mask")) {
        return res.status(400).json({ message: "Masks are not meant to be used on this API" });
    }
    console.log(`Updating ${name} to inProgress: ${status}`);
    let result = yield db.collection("images.files").updateOne({ filename: name }, { $set: { inProgress: status } });
    if (!result.acknowledged) {
        return res.status(500).json({ message: "Something went wrong" });
    }
    if (result.modifiedCount === 1) {
        return res.status(200).json({ message: `Updated inProgress to ${status}` });
    }
    return res.status(400).json({ message: "The update does not change information" });
}));
router.get("/:fileName", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET request to /setInProgress");
    let name = req.params.fileName;
    if (name.includes("_mask")) {
        return res.status(400).json({ message: "Masks are not meant to be used on this API" });
    }
    let result = yield db.collection("images.files").findOne({ filename: name });
    if (!result) {
        return res.status(400).json({ message: "File not found" });
    }
    return res.status(200).json({ inProgress: result.inProgress });
}));
exports.default = router;
