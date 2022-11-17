// Imports
import express from "express";
import mongoose from "mongoose";

// Router
const router = express.Router();

// Schema
import Image from "../models/images";

// Get all images
router.get("/", (req, res, next) => {
  Image.find().exec().then((docs: any) => {
    if (docs.length !== 0) {
        res.status(200).json(docs);
    } else {
        res.status(404).json({
            message: "No entries found"
        });

   
  }}).catch((err: any) => {
    res.status(500).json({
      error: err,
    });
  })
});

// Get one image by name
router.get("/:imageName", (req, res, next) => {

  // Check if the image name exists
  Image.findOne({ original: req.params.imageName})
    .exec()
    .then((doc: any) => {
      console.log(doc);
      if (doc != null) {
        res.status(200).json(doc);
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided name" });
      }
    })
    .catch((err: any) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Post
router.post("/", async (req, res, next) => {
  
    // Check if image exists
  const imageExists = await Image.exists({ original: req.body.original })

  if (imageExists) {
    // Update image
    Image.updateOne({original: req.body.original}, {$set: {mask: req.body.mask, overlay: req.body.overlay}})
    .exec().then((result: any) => {
        res.status(200).json({
            message: "Image updated",
        });
    })
  } else {
    // Create new image
    const image = new Image({
      _id: new mongoose.Types.ObjectId(),
      original: req.body.original,
      mask: req.body.mask,
      overlay: req.body.overlay,
    });
    image
      .save()
      .then((result: any) => {
        res.status(201).json({
          message: "Image added to DB",
        });
      })
      .catch((err: any) => {
        res.status(500).json({
          error: err,
        });
      });
  }
});

// Delete
router.delete("/:imageName", (req, res, next) => {

    // Remove ID
    Image.findOneAndRemove({ original: req.params.imageName}).exec().then((result: any) => {
        res.status(200).json(result);

    }).catch((err: any) => {
        console.log(err);
        res.status(500).json({ error: err });
    });
});

export default router;
