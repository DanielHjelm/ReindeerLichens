import axios from "axios";
export async function getImageAndMask(imageName: string): Promise<{ image: string; mask: string; notFound: boolean }> {
  console.log(`Fetching image ${imageName}`);
  try {
    let imageReq = axios.get(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images/${imageName}`);

    let maskReq = axios.get(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images/${imageName.split(".")[0]}_mask.${imageName.split(".")[1]}`, {
      validateStatus: () => true,
    });

    let [imageRes, maskRes] = await Promise.all([imageReq, maskReq]);
    // if (imageRes.status !== 200 || maskRes.status !== 200) {
    //   console.log("error fetching image or mask");
    // }

    if (imageRes.status !== 200) {
      console.log("Image server returned error: ", imageRes.statusText);
      return {
        notFound: true,
        image: "undefined",
        mask: "undefined",
      };
    }

    let image = imageRes.data;
    let mask = maskRes.data;
    if (imageName.toLowerCase().endsWith(".png")) {
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

    return {
      mask: mask,
      image: image,
      notFound: false,
    };
  } catch (error) {
    console.log("error fetching image or mask", error);
    return {
      notFound: true,
      image: "undefined",
      mask: "undefined",
    };
  }
}
