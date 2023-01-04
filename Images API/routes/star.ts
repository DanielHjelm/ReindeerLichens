import { Request, Response } from "express";
import express from "express";
import { client } from "./inProgress";
let db = client.db("ReindeerLichens");

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  let { fileName, star } = req.body;

  if (fileName === undefined) {
    return res.status(400).json({ message: "Missing fileName" });
  }

  if (star === undefined) {
    return res.status(400).json({ message: "Missing star" });
  }
  console.log(`Updating ${fileName} to star: ${star}`);

  let result = await db.collection("images.files").updateOne({ filename: fileName }, { $set: { star: star } });

  if (!result.acknowledged) {
    return res.status(500).json({ message: "No match for fileName" });
  }

  if (result.modifiedCount === 1) {
    return res.status(200).json({ message: `Updated star to ${star}` });
  }
  console.log(result);
  return res.status(400).json({ message: "The update does not change information" });
});

router.get("/", async (req: Request, res: Response) => {
  let { fileName } = req.query;

  if (fileName === undefined) {
    let allStarred = await db.collection("images.files").find({ star: true }).toArray();
    if (!allStarred) {
      return res.status(204).json({ message: "No starred images" });
    }
    return res.status(200).json({ allStarred: allStarred.map((document) => document.filename) });
  }

  let result = await db.collection("images.files").findOne({ filename: fileName });

  if (!result) {
    return res.status(400).json({ message: "File not found" });
  }

  return res.status(200).json({ star: result.star ?? false });
});

export default router;
