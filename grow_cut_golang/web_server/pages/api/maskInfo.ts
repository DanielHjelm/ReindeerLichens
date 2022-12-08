import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  let { fileName } = req.query;
  fileName = fileName as string;
  console.log({ fileName });
  if (fileName === undefined) {
    return res.status(400).json({ message: "Missing fileName" });
  }

  let starReq = axios(`http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/star?fileName=${encodeURIComponent(fileName as string)}`, {
    method: "GET",
  });

  let thresholdReq = axios(`http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/threshold?fileName=${encodeURIComponent(fileName as string)}`, {
    method: "GET",
  });

  let [starResponse, thresholdResponse] = await Promise.all([starReq, thresholdReq]);
  if (starResponse.status !== 200 || thresholdResponse.status !== 200) {
    return res.status(500).json({ message: "Failed to fetch information" });
  }

  return res.status(200).json({ star: starResponse.data.star ?? false, threshold: thresholdResponse.data.threshold ?? "No data" });
}
