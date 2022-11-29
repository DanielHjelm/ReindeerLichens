import React, { useEffect, useRef, useState } from "react";
import _Image from "next/image";
import axios from "axios";
import NextScript from "next/script";
import { getImageAndMask } from "../Utils/db";

// Image to base64
const getBase64 = (file: Blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default function imageName({ imageName, imageFile }: { imageName: string; imageFile: string }) {
  let [loaded, setLoaded] = React.useState(false);

  const [canvasRef, setCanvasRef] = useState(useRef(null));
  const ctxRef = useRef<CanvasRenderingContext2D>();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [lineColor, setLineColor] = useState("red");
  const [lineOpacity, setLineOpacity] = useState(100);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  let [endPoint, setEndPoint] = React.useState("localhost:3001/start");
  let [pixels, setPixels] = React.useState<{ x: number; y: number }[]>([]);

  async function sendRequest() {
    try {
      console.log({ pixels });

      const response = await fetch(`http://${endPoint}`, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          fileName: imageName,
          pixels: pixels,
          img: imageFile,
        }),
      });
      const data = await response.json();
      console.log(data);
    } catch {
      console.log("error");
    }
  }

  // Initialization when the component
  // mounts for the first time
  useEffect(() => {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = lineOpacity;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    window.addEventListener(
      "resize",
      function (event) {
        console.log(event.target);
      },
      true
    );

    ctxRef.current = ctx;
    var i = new Image();

    i.src = imageFile;
    i.onload = function () {
      console.log({ width: i.width, height: i.height });
      ctx.drawImage(i, 0, 0);

      setImageSize({ width: i.width, height: i.height });
    };
  }, [lineColor, lineOpacity, lineWidth]);

  // Function for starting the drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    ctxRef.current!.beginPath();
    ctxRef.current!.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

    setPixels((prev) => [...prev, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }]);
    setIsDrawing(true);
  };

  // Function for ending the drawing
  const endDrawing = () => {
    ctxRef.current!.closePath();
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isDrawing) {
      return;
    }
    ctxRef.current!.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    console.log("Drawing");
    setPixels((prev) => [...prev, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }]);

    ctxRef.current!.stroke();
  };

  return (
    <div className={`relative w-[${imageSize.width}px]`}>
      <NextScript />
      <style jsx global>{`
        /* Other global styles such as 'html, body' etc... */

        #__next {
          width: ${imageSize.width}px;
        }
      `}</style>
      <canvas
        height={imageSize.height}
        width={imageSize.width}
        className="absolute z-10 cursor-crosshair"
        id="canvas"
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
      ></canvas>
      <img src={imageFile} alt="" />

      <div className="fixed block top-1/2 left-[10rem] z-20 p-4 bg-white rounded-sm">
        <input
          type="text"
          placeholder="Enter Endpoint"
          defaultValue={endPoint}
          className="mb-4 rounded border border-gray-300 p-2"
          onChange={(e) => {
            setEndPoint(e.target.value);
          }}
        />
        <div
          className=" max-h-[4rem] max-w-[10rem] right-10 bottom-10 z-20 bg-blue-700 border rounded py-2 px-6 text-white font-bold border-black cursor-pointer"
          onClick={sendRequest}
        >
          Send
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps(context: any) {
  const imageName = context.params.imageName;

  let imageAndMask = await getImageAndMask(imageName);

  if (imageAndMask.notFound) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      imageName: imageName,
      imageFile: imageAndMask.image,
    },
  };

  return {
    props: {
      imageName: "test",
      imageFile: "https",
    },
  };
}

// export async function getStaticPaths() {
//   let res = await fetch(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images`);

//   if (res.status !== 200) {
//     return {
//       notFound: true,
//     };
//   }

//   let imageNames = await res.json();

//   console.log({ paths: imageNames });

//   // console.log(res);
//   // console.log(res);
//   return {
//     paths: {
//       imageName: await JSON.parse(imageNames),
//     },
//   };
// }

export async function getStaticPaths() {
  let res = await axios.get(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images`);

  if (res.status !== 200) {
    return {
      notFound: true,
    };
  }

  let body = res.data;
  console.log({ body });
  let images = body.images;
  let fileNames = images.map((image: any) => image.filename);
  console.log({ fileNames });

  return {
    paths: fileNames.map((fileName: string) => ({
      params: {
        imageName: fileName,
      },
    })),
    fallback: false,
  };
}
