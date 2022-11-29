import React, { LegacyRef, useEffect } from "react";
import { getImageAndMask } from "../../Utils/db";
import axios from "axios";

export default function Mask({ mask, image }: { mask: string; image: string }) {
  let [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
  let [maskSize, setMaskSize] = React.useState({ width: 0, height: 0 });
  const ctxRef = React.useRef<CanvasRenderingContext2D>();
  //   let [isDrawing, setIsDrawing] = React.useState(false);
  let isDrawing = false;
  let [maskLoaded, setMaskLoaded] = React.useState(false);

  function removeBackground(imageData: ImageData): ImageData {
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      if (r === 0 && g === 0 && b === 0) {
        //   console.log("black");
        data[i + 3] = 0;
      } else {
        data[i + 3] = 255;
        data[i] = 234;
        data[i + 1] = 67;
        data[i + 2] = 54;
      }
    }
    return imageData;
  }

  const [canvasRef, setCanvasRef] = React.useState(React.useRef(null));
  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctxRef.current = ctx;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };

    if (mask !== "") {
      const msk = new Image();
      msk.src = mask;
      ctxRef.current.lineWidth = 20;
      ctxRef.current.lineCap = "round";
      ctxRef.current.strokeStyle = "black";
      msk.onload = () => {
        ctx.drawImage(msk, 0, 0);
        const imageData = ctx.getImageData(0, 0, msk.width, msk.height);
        let mask = removeBackground(imageData);

        ctx.putImageData(mask, 0, 0);
        setMaskLoaded(true);
        setMaskSize({ width: msk.width, height: msk.height });
      };
    }
  }, [maskLoaded]);

  // Function for starting the drawing
  const startDrawing = (e: any) => {
    if (ctxRef.current === undefined) {
      return;
    }

    console.log("start drawing");
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    // setIsDrawing(true);
    isDrawing = true;
  };

  // Function for ending the drawing
  const endDrawing = () => {
    if (ctxRef.current === undefined) {
      return;
    }
    ctxRef.current.closePath();
    // setIsDrawing(false);
    isDrawing = false;
    let imageData = ctxRef.current.getImageData(0, 0, imageSize.width, imageSize.height);
    let mask = removeBackground(imageData);
    ctxRef.current.putImageData(mask, 0, 0);
  };

  const draw = (e: any) => {
    if (!isDrawing || ctxRef.current === undefined) {
      return;
    }
    ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current.stroke();
  };

  return (
    <div className={`relative w-[${imageSize.width}px] h-[${imageSize.height}px]`}>
      <style jsx global>{`
        /* Other global styles such as 'html, body' etc... */

        #__next {
          width: ${imageSize.width}px;
        }
      `}</style>
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        className="z-100 absolute"
        id="canvas"
        width={maskSize.width}
        height={maskSize.height}
      ></canvas>
      <img className="" height={imageSize.height} width={imageSize.width} src={image} alt="image" />
    </div>
  );
}

export async function getStaticProps(context: any) {
  const imageName = context.params.imageName;
  return {
    props: await getImageAndMask(imageName),
  };
}

export async function getStaticPaths() {
  let res = await axios.get(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images`);
  if (res.status !== 200) {
    return {
      notFound: true,
    };
  }
  let images = res.data["images"] as string[];
  let imageNames = images.map((path: any) => path["filename"]).filter((name: string) => name.includes("_mask") === false);

  let paths = imageNames.map((name: string) => ({
    params: {
      imageName: name,
    },
  }));

  return {
    paths: paths,
    fallback: false,
  };
}
