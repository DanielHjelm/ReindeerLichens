// Imports
import console from "console";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";

// Old implementation, saved for reference
// const upload = require("../middleware/upload");

// module.exports = multer({ storage: storage });

// Schema
// import Image from "../models/images";

// GridFS
// const Grid = require("gridfs-stream");
import Grid from "gridfs-stream";
import mongo, { MongoClient } from "mongodb";
let gfs: Grid.Grid, gridfsBucket: any;
import dotenv from "dotenv";
dotenv.config();

// Mongoose connection
const conn = mongoose.connection;
// Connect to MongoDB
conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "images",
  });

  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("images");
});

console.log(`Conencting to storage server at ${process.env.MONGO_DB}`);
// GridFS storage, called in post request
const storage = new GridFsStorage({
  // URL
  url: process.env.MONGO_DB!,

  // Options
  options: { useNewUrlParser: true, useUnifiedTopology: true },

  // Handle file upload
  file: async (req: any, file: any) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      return undefined;
    }
    // Loop through the files
    try {
      gfs
        .collection("images")
        .find()
        .toArray((err: any, files: any) => {
          files.forEach((fileInDB: any) => {
            // Check if the file is already in the database
            if (fileInDB.filename === file.originalname) {
              console.log("File already exists, old file will be overwritten");
              // Delete the file from the database
              gridfsBucket.delete(new mongoose.Types.ObjectId(fileInDB._id), (err: any) => {
                console.log("File deleted");
                if (err) {
                  console.log(err);
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
    } catch (err) {
      console.log(err);
    }
  },
});

// Multer/GridFS middleware
const upload = multer({
  storage,
});

// Router
const router = express.Router();

// Get information about all images in DB
router.get("/", async (req, res, next) => {
  // Try to find images in database
  try {
    await gridfsBucket.find().toArray((err: any, files: any) => {
      // Check if files exists
      if (!files || files.length === 0) {
        return res.status(204).json({
          err: "No files exist",
        });
      } else {
        // Files exist, return file information and number of files
        return res.status(200).json({
          numberOfImages: files.length,
          images: files.map((file: any) => {
            // Do we want to see more? More attributes: length, chunkSize, uploadDate etc.
            return {
              _id: file._id,
              filename: file.filename,
              uploadDate: file.uploadDate,
              inProgress: file.inProgress ?? false,
            };
          }),
        });
      }
    });
    // Catch errors
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});

// Fetch one image by name
router.get("/:imageName", async (req, res) => {
  try {
    // Find file in database
    await gfs.files.findOne({ filename: req.params.imageName }, (err: any, file: any) => {
      if (!file || file.length === 0) {
        // File not found
        return res.status(204).json({ err: "No File Exists" });
      } else {
        // File found, return file
        const readStream = gridfsBucket.openDownloadStream(file._id);

        // Send BASE64 encoded image
        let data = "";
        readStream.on("data", (chunk: any) => {
          data += chunk.toString("base64");
        });
        readStream.on("end", () => {
          res.send(data);
        });

        // Pipe file to response
        // readStream.pipe(res);
      }
    });
  } catch (err) {
    res.status(500).json({ err: err });
  }
});

// Post request, upload image
router.post("/", upload.single("file"), (req, res) => {
  console.log(req.file);
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
router.delete("/:imageName", async (req, res, next) => {
  try {
    // Check if image exists
    await gfs.files.findOne({ filename: req.params.imageName }, (err: any, file: any) => {
      if (!file || file.length === 0) {
        return res.status(204).json({ err: "No file with that name exists, please try again!" });
      } else {
        // Delete image
        gridfsBucket.delete(new mongoose.Types.ObjectId(file._id), (err: any) => {
          if (err) {
            return res.status(500).json({ err: err });
          } else {
            res.status(200).json({
              message: "File successfully deleted from database",
              file: file,
            });
          }
        });
      }
    });
    // Catch errors
  } catch (err) {
    res.status(500).json({ err: err });
  }
});

export default router;
