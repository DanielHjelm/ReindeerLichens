// Imports
import console from "console";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import {GridFsStorage} from 'multer-gridfs-storage'

// Image handling
// const upload = require("../middleware/upload");


// GridFS
const Grid = require("gridfs-stream");
let gfs: any, gridfsBucket: any;

const conn = mongoose.connection;
conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'images'
  });
 
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('images');
 })

// GridFS storage
const storage = new GridFsStorage({
  url: "mongodb+srv://admin:" +
  "hejhej" +
  "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority",
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req: any, file: any) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${file.originalname}`;
      return filename;
    }
    // Loop through the files
    gfs.collection('images').find().toArray((err: any, files: any) => {
      files.forEach((fileInDB:any) => {
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
    }

  },});

  
  const upload = multer({
    storage
  });

  // module.exports = multer({ storage: storage });

// Router
const router = express.Router();

// Schema
import Image from "../models/images";

// Get all images
router.get("/", (req, res, next) => {
  gridfsBucket.find().toArray((err: any, files: any) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "No files exist",
      });
      
    } else {
      files.map((file: any) => {
        if (
          file.contentType === "image/jpeg" ||
          file.contentType === "image/png"
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      }
      );
      res.status(200).json(files);

    }
  });
  // Image.find()
  //   .select("_id original mask overlay")
  //   .exec()
  //   .then((docs: any) => {
  //     const response = {
  //       numberOfImagesInDB: docs.length,
  //       images: docs,
  //     };
  //     if (docs.length !== 0) {
  //       res.status(200).json(response);
  //     } else {
  //       res.status(404).json({
  //         message: "No entries found",
  //       });
  //     }
  //   })
  //   .catch((err: any) => {
  //     res.status(500).json({
  //       error: err,
  //     });
  //   });
});

// Get one image by name
router.get("/:imageName", async (req, res) => {
  try{
    await gfs.files.findOne({filename: req.params.imageName}, (err:any, file:any) => {
        if(!file || file.length === 0){
            return res.status(404).json({err: 'No File Exists'});
        } else {
            // Check if is image
            if(file.contentType === "image/jpeg" || file.contentType === "image/png"){
                // Read output to broswer
                const readStream = gridfsBucket.openDownloadStream(file._id);
                readStream.pipe(res);
            } else {
                res.status(404).json({err: 'Not and image'});
            }
        }
    })
  } catch (err) {
    res.status(500).json({err: err});
  }
});
  // // Check if the image name exists
  // Image.findOne({ original: req.params.imageName })
  //   .select("_id original mask overlay")
  //   .exec()
  //   .then((doc: any) => {
  //     console.log(doc);
  //     if (doc != null) {
  //       res.status(200).json(doc);
  //     } else {
  //       res
  //         .status(404)
  //         .json({ message: "No valid entry found for provided name" });
  //     }
  //   })
  //   .catch((err: any) => {
  //     console.log(err);
  //     res.status(500).json({ error: err });
  //   });
// });

// Post
router.post("/", upload.single('file'), (req, res) => {
  // console.log(req.file);
  if (req.file == undefined) {
    return res.status(400).send({
      message: "Please upload a file!"});
  }
  res.status(200).send({
    message: "Uploaded the file successfully: " + req.file.originalname,
  });
});

  
  // const imageURL = 'http://localhost:8000/images/' + req.file.filename;
  // return res.send(imageURL);
  // Check if image exists
  // const imageExists = await Image.exists({ original: req.body.original });

  // if (imageExists) {
  //   // Update image
  //   Image.updateOne(
  //     { original: req.body.original },
  //     { $set: { mask: req.body.mask, overlay: req.body.overlay } }
  //   )
  //     .exec()
  //     .then((result: any) => {
  //       res.status(200).json({
  //         message: "Image updated",
  //         updatedImage: {
  //           original: req.body.original,
  //           mask: req.body.mask,
  //           overlay: req.body.overlay,
  //         },
  //       });
  //     });
  // } else {
  //   // Create new image
  //   const image = new Image({
  //     _id: new mongoose.Types.ObjectId(),
  //     original: req.body.original,
  //     mask: req.body.mask,
  //     overlay: req.body.overlay,
  //   });
  //   image
  //     .save()
  //     .then((result: any) => {
  //       res.status(201).json({
  //         message: "Image added to DB",
  //         addedImage: {
  //           _id: result._id,
  //           original: result.original,
  //           mask: result.mask,
  //           overlay: result.overlay,
  //         },
  //       });
  //     })
  //     .catch((err: any) => {
  //       res.status(500).json({
  //         error: err,
  //       });
  //     });
  // }
// });

// Delete
router.delete("/:imageName", async (req, res, next) => {
  try{
    // Check if image exists
    await gfs.files.findOne({filename: req.params.imageName}, (err:any, file:any) => {
        if(!file || file.length === 0){
            return res.status(404).json({err: 'No file Exists'});
        } else {
            // Check if is image
            if(file.contentType === "image/jpeg" || file.contentType === "image/png"){
                // Delete image
                gridfsBucket.delete(new mongoose.Types.ObjectId(file._id), (err: any) => {
                  if(err){
                      return res.status(404).json({err: err});
                  } else {
                      res.status(200).json({message: 'File deleted'});
                  }
                });
            } else {
                res.status(404).json({err: 'Not and image'});
            }
        }
    })
  } catch (err) {
    res.status(500).json({err: err});
  }
});

  

  
  
  
  // gfs.delete(req.params.imageName, (err: any) => {
  //   if (err) {
  //     return res.status(404).json({ err: err });
  //   } else {
  //     res.status(200).json({ message: "Image deleted" });
  //   }
  // });
  // try {
  //   await gfs.files.deleteOne({ filename: req.params.imageName });
  //   res.send('Image deleted');
  // } catch (error) {
  //   console.log(error);
  //   res.send('Error: Not found');
  // }
  // // Remove ID
  // Image.findOneAndRemove({ original: req.params.imageName })
  //   .exec()
  //   .then((result: any) => {
  //     res.status(200).json(result);
  //   })
  //   .catch((err: any) => {
  //     console.log(err);
  //     res.status(500).json({ error: err });
  //   });
// });

export default router;
