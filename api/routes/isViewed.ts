import { Request, Response } from "express";
import express from "express";
import { client } from "./inProgress";
let db = client.db("ReindeerLichens");

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  let { fileName, isViewed } = req.body;

  if (fileName === undefined) {
    return res.status(400).json({ message: "Missing fileName" });
  }

  if (isViewed === undefined) {
    return res.status(400).json({ message: "Missing viwewed status" });
  }

  let result = await db.collection("images.files").updateOne({ filename: fileName }, { $set: { isViewed: isViewed } });

  if (!result.acknowledged) {
    return res.status(500).json({ message: "No match for fileName" });
  }

  if (result.modifiedCount === 1) {
    return res.status(200).json({ message: `Updated viewed status to ${isViewed}` });
  }
  console.log(result);
  return res.status(304).json({ message: "The update does not change information" });
});

router.get("/", async (req: Request, res: Response) => {
  let { fileName } = req.query;

  if (fileName === undefined) {
    let allViewed = await db.collection("images.files").find({ isViewed: true }).toArray();
    if (!allViewed) {
      return res.status(204).json({ message: "No images are currently being viewed" });
    }
    return res.status(200).json({ allViewed: allViewed.map((document) => document.filename) });
  }
  let result = await db.collection("images.files").findOne({ filename: fileName });

  if (!result) {
    return res.status(400).json({ message: "File not found" });
  }

  console.log(`Is viewed status for ${fileName} is ${result.isViewed}`);
  return res.status(200).json({ isViwewd: result.isViewed ?? false });
});

export default router;
