"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Not used anymore but saved here for later reference
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const imageSchema = new Schema({
    _id: mongoose_1.default.Schema.Types.ObjectId,
    length: { type: Number },
    original: { type: String, trim: true, searchable: true },
    mask: { type: String, trim: true, searchable: true },
    overlay: { type: String, trim: true, searchable: true },
});
exports.default = mongoose_1.default.model("Image", imageSchema);
