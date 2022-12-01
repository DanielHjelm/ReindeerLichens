import express from "express";
import { MongoClient, MongoClientOptions } from "mongodb";

const router = express.Router();

let client = new MongoClient("mongodb://localhost:27017", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as MongoClientOptions);
let db = client.db("ReindeerLichens");

router.post("/", async (req, res, next) => {
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
  let result = await db.collection("images.files").updateOne({ filename: name }, { $set: { inProgress: status } });
  if (!result.acknowledged) {
    return res.status(500).json({ message: "Something went wrong" });
  }
  if (result.modifiedCount === 1) {
    return res.status(200).json({ message: `Updated inProgress to ${status}` });
  }
  return res.status(400).json({ message: "The update does not change information" });
});

router.get("/:fileName", async (req, res, next) => {
  console.log("GET request to /setInProgress");
  let name = req.params.fileName;
  if (name.includes("_mask")) {
    return res.status(400).json({ message: "Masks are not meant to be used on this API" });
  }
  let result = await db.collection("images.files").findOne({ filename: name });
  if (!result) {
    return res.status(400).json({ message: "File not found" });
  }
  return res.status(200).json({ inProgress: result.inProgress });
});

export default router;
