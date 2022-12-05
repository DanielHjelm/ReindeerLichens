import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    let { fileName } = req.query;
    if (fileName === undefined) {
      let response = await axios(`http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/isViewed`, {
        method: "GET",
      });
      if (response.status !== 200) {
        return res.status(response.status).json({ message: response.data.message });
      }
      return res.status(200).json({ allViewed: response.data.allViewed });
    }
    let response = await axios(`http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/isViewed?fileName=${encodeURIComponent(fileName as string)}`, {
      method: "GET",
    });
    if (response.status !== 200) {
      return res.status(response.status).json({ message: response.data.message });
    }
    return res.status(200).json({ isViewed: response.data.isViewed });
  }

  if (req.method === "POST") {
    const { fileName, isViewed } = req.body;

    if (fileName === undefined) {
      return res.status(400).json({ message: "Missing fileName" });
    }

    if (isViewed === undefined) {
      return res.status(400).json({ message: "Missing isViewed" });
    }

    let response = await axios.post(
      `http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/isViewed`,
      {
        fileName: fileName,
        isViewed: isViewed,
      },
      {
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status !== 200) {
      return res.status(response.status).json({ message: response.data.message });
    }

    console.log(`Marked ${fileName} as ${isViewed}`);
    return res.status(200).json({ message: response.data.message });
  }
}
