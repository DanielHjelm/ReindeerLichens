import { NextApiRequest, NextApiResponse } from "next";

import modelJSON from "../../model/model.json";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return res.status(200).json(JSON.stringify(modelJSON));
}
