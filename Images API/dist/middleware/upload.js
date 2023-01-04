"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Not used anymore but saved here for later reference
// Multer and Storage in GridFS
const multer_1 = __importDefault(require("multer"));
const multer_gridfs_storage_1 = require("multer-gridfs-storage");
const storage = new multer_gridfs_storage_1.GridFsStorage({
    url: "mongodb+srv://admin:" +
        "hejhej" +
        "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority",
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        const match = ["image/png", "image/jpeg"];
        if (match.indexOf(file.mimetype) === -1) {
            const filename = `${file.originalname}`;
            return filename;
        }
        return {
            bucketName: "images",
            filename: `${file.originalname}`,
        };
    },
});
module.exports = (0, multer_1.default)({ storage: storage });
