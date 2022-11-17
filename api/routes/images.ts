// Imports
import express from "express";
import mongoose from "mongoose";

// Router
const router = express.Router();

// Schema
const Image = require("../models/images");

// Get
router.get("/", (req, res, next) => {
  // Implement get image names
  res.status(200).json({
    message: "Handling GET requests to /images",
  });
});

router.get("/:imageName", (req, res, next) => {
  // Implement get image by id

  res.status(200).json({
    message: "You received image",
    image: req.params.imageName,
  });
});

// Post
router.post("/", (req, res, next) => {
  // Implement post image
  // Check if image exists
  // If image exists, updated current image in database
  // If image does not exist, create new image in database
  const image = new Image({
    _id: new mongoose.Types.ObjectId(),
    original: req.body.original,
    mask: req.body.mask,
    overlay: req.body.overlay,
  });
  image
    .save()
    .then((result: any) => {
      console.log(result);
    })
    .catch((err: any) => console.log(err));
  res.status(201).json({
    message: "You posted image",
    postedImage: image,
  });
});

export default router;
