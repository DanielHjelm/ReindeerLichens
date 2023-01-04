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
const express_1 = __importDefault(require("express"));
const inProgress_1 = require("./inProgress");
let db = inProgress_1.client.db("ReindeerLichens");
const router = express_1.default.Router();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { fileName, threshold } = req.body;
    if (fileName === undefined) {
        return res.status(400).json({ message: "Missing fileName" });
    }
    if (threshold === undefined) {
        return res.status(400).json({ message: "Missing threshold" });
    }
    console.log(`Updating ${fileName} to threshold: ${threshold}`);
    let result = yield db.collection("images.files").updateOne({ filename: fileName }, { $set: { threshold: threshold } });
    if (!result.acknowledged) {
        return res.status(500).json({ message: "No match for fileName" });
    }
    if (result.modifiedCount === 1) {
        return res.status(200).json({ message: `Updated threshold to ${threshold}` });
    }
    console.log(result);
    return res.status(400).json({ message: "The update does not change information" });
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { fileName } = req.query;
    if (fileName === undefined) {
        return res.status(400).json({ message: "Missing fileName" });
    }
    let result = yield db.collection("images.files").findOne({ filename: fileName });
    if (!result) {
        return res.status(400).json({ message: "File not found" });
    }
    return res.status(200).json({ threshold: (_a = result.threshold) !== null && _a !== void 0 ? _a : "No data" });
}));
exports.default = router;
