import { Request, Response } from "express";
import express from "express";
import { client } from "./inProgress";
let db = client.db("ReindeerLichens");

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  let { fileName, threshold } = req.body;

  if (fileName === undefined) {
    return res.status(400).json({ message: "Missing fileName" });
  }


  if (threshold === undefined) {
    return res.status(400).json({ message: "Missing threshold" });
  }
  console.log(`Updating ${fileName} to threshold: ${threshold}`);

  let result = await db.collection("images.files").updateOne({ filename: fileName }, { $set: { threshold: threshold } });

  if (!result.acknowledged) {
    return res.status(500).json({ message: "No match for fileName" });
  }

  if (result.modifiedCount === 1) {
    return res.status(200).json({ message: `Updated threshold to ${threshold}` });
  }
  console.log(result);
  return res.status(400).json({ message: "The update does not change information" });
});

router.get("/", async (req: Request, res: Response) => {
  let { fileName } = req.query;

  if (fileName === undefined) {
    return res.status(400).json({ message: "Missing fileName" });
  }

  let result = await db.collection("images.files").findOne({ filename: fileName });

  if (!result) {
    return res.status(400).json({ message: "File not found" });
  }

  return res.status(200).json({ threshold: result.threshold ?? "No data" });
});

export default router;
