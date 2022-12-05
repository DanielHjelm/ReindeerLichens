import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  let { fileName } = req.query;
  console.log({ fileName });
  if (fileName === undefined) {
    return res.status(400).json({ message: "Missing fileName" });
  }

  let response = await axios(`http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/star?fileName=${encodeURIComponent(fileName as string)}`, {
    method: "GET",
  });
  if (response.status !== 200) {
    return res.status(response.status).json({ message: response.data.message });
  }
  console.log({ data: response.data });
  return res.status(200).json({ star: response.data.star ?? false });
}
