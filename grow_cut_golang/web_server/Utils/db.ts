import axios from "axios";
export async function getImageAndMask(fileName: string): Promise<{ image: string; mask: string; fileName: string; notFound: boolean }> {
  console.log(`Fetching image ${fileName}`);
  try {
    let imageReq = axios.get(`http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? "localhost"}/images/${fileName}`);

    let maskReq = axios.get(
      `http://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? "localhost"}/images/${fileName.split(".")[0]}_mask.${fileName.split(".")[1]}`,
      {
        validateStatus: () => true,
      }
    );

    let [imageRes, maskRes] = await Promise.all([imageReq, maskReq]);
    // if (imageRes.status !== 200 || maskRes.status !== 200) {
    //   console.log("error fetching image or mask");
    // }

    if (imageRes.status !== 200) {
      console.log("Image server returned error: ", imageRes.statusText);
      return {
        notFound: true,
        image: "undefined",
        fileName: "undefined",
        mask: "undefined",
      };
    }

    let image = imageRes.data;
    let mask = maskRes.data;
    if (fileName.toLowerCase().endsWith(".png")) {
      image = `data:image/png;base64,${image}`;
      mask = `data:image/png;base64,${mask}`;
    } else {
      image = `data:image/jpeg;base64,${image}`;
      mask = `data:image/jpeg;base64,${mask}`;
    }
    if (maskRes.status !== 200) {
      console.log("Mask server returned error: ", maskRes.statusText);
      mask = "undefined";
    }
    console.log("Success fetching image and mask");
    return {
      mask: mask,
      image: image,
      fileName: fileName,
      notFound: false,
    };
  } catch (error) {
    console.log("error fetching image or mask", error);
    return {
      notFound: true,
      image: "undefined",
      mask: "undefined",
      fileName: "undefined",
    };
  }
}
