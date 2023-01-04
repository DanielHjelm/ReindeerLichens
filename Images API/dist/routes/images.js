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
// Imports
const console_1 = __importDefault(require("console"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const multer_gridfs_storage_1 = require("multer-gridfs-storage");
// Old implementation, saved for reference
// const upload = require("../middleware/upload");
// module.exports = multer({ storage: storage });
// Schema
// import Image from "../models/images";
// GridFS
// const Grid = require("gridfs-stream");
const gridfs_stream_1 = __importDefault(require("gridfs-stream"));
let gfs, gridfsBucket;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Mongoose connection
const conn = mongoose_1.default.connection;
// Connect to MongoDB
conn.once("open", () => {
    gridfsBucket = new mongoose_1.default.mongo.GridFSBucket(conn.db, {
        bucketName: "images",
    });
    gfs = (0, gridfs_stream_1.default)(conn.db, mongoose_1.default.mongo);
    gfs.collection("images");
});
console_1.default.log(`Conencting to storage server at ${process.env.MONGO_DB}`);
// GridFS storage, called in post request
const storage = new multer_gridfs_storage_1.GridFsStorage({
    // URL
    url: process.env.MONGO_DB,
    // Options
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    // Handle file upload
    file: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        const match = ["image/png", "image/jpeg"];
        if (match.indexOf(file.mimetype) === -1) {
            return undefined;
        }
        // Loop through the files
        try {
            gfs
                .collection("images")
                .find()
                .toArray((err, files) => {
                files.forEach((fileInDB) => {
                    // Check if the file is already in the database
                    if (fileInDB.filename === file.originalname) {
                        console_1.default.log("File already exists, old file will be overwritten");
                        // Delete the file from the database
                        gridfsBucket.delete(new mongoose_1.default.Types.ObjectId(fileInDB._id), (err) => {
                            console_1.default.log("File deleted");
                            if (err) {
                                console_1.default.log(err);
                            }
                        });
                    }
                });
            });
            // Add new file to database
            return {
                bucketName: "images",
                filename: `${file.originalname}`,
            };
            // Catch error
        }
        catch (err) {
            console_1.default.log(err);
        }
    }),
});
// Multer/GridFS middleware
const upload = (0, multer_1.default)({
    storage,
});
// Router
const router = express_1.default.Router();
// Get information about all images in DB
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Try to find images in database
    console_1.default.log("Running get");
    try {
        yield gridfsBucket.find().toArray((err, files) => {
            // Check if files exists
            if (!files || files.length === 0) {
                return res.status(204).json({
                    err: "No files exist",
                });
            }
            else {
                // Files exist, return file information and number of files
                return res.status(200).json({
                    numberOfImages: files.length,
                    images: files.map((file) => {
                        // Do we want to see more? More attributes: length, chunkSize, uploadDate etc.
                        var _a, _b, _c, _d;
                        return {
                            _id: file._id,
                            filename: file.filename,
                            uploadDate: file.uploadDate,
                            inProgress: (_a = file.inProgress) !== null && _a !== void 0 ? _a : false,
                            star: (_b = file.star) !== null && _b !== void 0 ? _b : false,
                            isViewed: (_c = file.isViewed) !== null && _c !== void 0 ? _c : false,
                            threshold: (_d = file.threshold) !== null && _d !== void 0 ? _d : "No data",
                        };
                    }),
                });
            }
        });
        // Catch errors
    }
    catch (err) {
        console_1.default.log(err);
        res.status(500).json({
            error: err,
        });
    }
}));
// Fetch one image by name
router.get("/:imageName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find file in database
        yield gfs.files.findOne({ filename: req.params.imageName }, (err, file) => {
            if (!file || file.length === 0) {
                // File not found
                return res.status(204).json({ err: "No File Exists" });
            }
            else {
                // File found, return file
                const readStream = gridfsBucket.openDownloadStream(file._id);
                // Send BASE64 encoded image
                let data = "";
                readStream.on("data", (chunk) => {
                    data += chunk.toString("base64");
                });
                readStream.on("end", () => {
                    res.send(data);
                });
                // Pipe file to response
                // readStream.pipe(res);
            }
        });
    }
    catch (err) {
        res.status(500).json({ err: err });
    }
}));
// Post request, upload image
router.post("/", upload.single("file"), (req, res) => {
    console_1.default.log(req.file);
    // console.log(req.file);
    if (req.file == undefined) {
        return res.status(400).send({
            message: "Please upload a file!",
        });
    }
    res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
    });
});
// Delete image by name
router.delete("/:imageName", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if image exists
        yield gfs.files.findOne({ filename: req.params.imageName }, (err, file) => {
            if (!file || file.length === 0) {
                return res.status(204).json({ err: "No file with that name exists, please try again!" });
            }
            else {
                // Delete image
                gridfsBucket.delete(new mongoose_1.default.Types.ObjectId(file._id), (err) => {
                    if (err) {
                        return res.status(500).json({ err: err });
                    }
                    else {
                        res.status(200).json({
                            message: "File successfully deleted from database",
                            file: file,
                        });
                    }
                });
            }
        });
        // Catch errors
    }
    catch (err) {
        res.status(500).json({ err: err });
    }
}));
exports.default = router;
