import React, { LegacyRef, useEffect } from "react";
import { getImageAndMask } from "../../Utils/db";
import axios from "axios";

export default function Mask({ mask, image, fileName }: { mask: string; image: string; fileName: string }) {
  let [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
  let [maskSize, setMaskSize] = React.useState({ width: 0, height: 0 });
  let [lineWidth, setLineWidth] = React.useState(20);
  let [requestStatus, setRequestStatus] = React.useState("idle");
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
        data[i + 3] = 100;
        data[i] = 151;
        data[i + 1] = 31;
        data[i + 2] = 230;
      }
    }
    return imageData;
  }

  function blackoutBackground(imageData: ImageData): ImageData {
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let a = data[i + 3];
      if (a === 0) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
    return imageData;
  }

  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctxRef.current = ctx;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };

    window.addEventListener("mousemove", (e) => {
      if (!isDrawing) {
        let div = document.getElementById("line-width-indicator");
        if (!div) return;
        div.style.left = e.clientX + "px";
        div.style.top = e.clientY + "px";
      }
    });

    if (mask !== "") {
      const msk = new Image();
      msk.src = mask;
      ctxRef.current.lineWidth = lineWidth;
      ctxRef.current.lineCap = "round";
      ctxRef.current.strokeStyle = "black";
      msk.onload = () => {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(msk, 0, 0);
        const imageData = ctx.getImageData(0, 0, msk.width, msk.height);
        let mask = removeBackground(imageData);

        ctx.putImageData(mask, 0, 0);
        setMaskLoaded(true);
        setMaskSize({ width: msk.width, height: msk.height });
      };
    }
  }, [maskLoaded]);

  function resetCanvas() {
    const msk = new Image();
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    msk.src = mask;
    ctxRef.current!.lineWidth = lineWidth;
    ctxRef.current!.lineCap = "round";
    ctxRef.current!.strokeStyle = "black";
    msk.onload = () => {
      ctx.drawImage(msk, 0, 0);
      const imageData = ctx.getImageData(0, 0, msk.width, msk.height);
      let mask = removeBackground(imageData);

      ctx.putImageData(mask, 0, 0);
      setMaskLoaded(true);
      setMaskSize({ width: msk.width, height: msk.height });
    };
  }

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
  async function base64ToFile(b64: string): Promise<File> {
    let blob = await (await fetch(b64)).blob();
    let fileType = b64.split(";")[0].split(":")[1];
    let end = fileName.split(".")[1];
    let _fileName = fileName.split(".")[0] + "_mask." + end;
    let file = new File([blob], _fileName, { type: fileType });

    return file;
  }

  async function saveChanges() {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let formdata = new FormData();
    let imageData = ctxRef.current!.getImageData(0, 0, imageSize.width, imageSize.height);
    let mask = blackoutBackground(imageData);
    console.log(mask);
    ctxRef.current!.putImageData(mask, 0, 0);
    let b64 = canvas.toDataURL();
    let file = await base64ToFile(b64);

    formdata.append("file", file);
    console.log(`Sending request to ${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/images`);
    setRequestStatus("loading");

    let res = await axios.post(`https://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? ""}/images`, formdata);
    if (res.status == 200) {
      setRequestStatus("ok");
    } else {
      setRequestStatus("error");
    }
    setTimeout(() => {
      setRequestStatus("idle");
    }, 5000);
    console.log(res);
  }
  function getRequestStatusSymbol() {
    switch (requestStatus) {
      case "ok":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        );
        break;
      case "loading":
        return (
          <svg
            aria-hidden="false"
            className=" w-6 h-6 text-white animate-spin dark:text-white fill-[#013171] shrink"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        );

        break;
      case "idle":
        return <div></div>;

      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        );
        break;
    }
  }

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
        className="z-100 absolute cursor-crosshair"
        id="canvas"
        width={maskSize.width}
        height={maskSize.height}
      ></canvas>
      <img className="" height={imageSize.height} width={imageSize.width} src={image} alt="image" />
      <div className="fixed top-1/2 left-[5rem] bg-white rounded p-4">
        <div>
          <p>Set lineWidth</p>
          <input
            className="border rounded max-w-[3rem] px-2"
            type="text"
            value={lineWidth}
            onChange={(e) => {
              if (e.target.value === "") {
                setLineWidth(1);
                ctxRef.current!.lineWidth = 1;
                return;
              }
              console.log(e.target.value);
              setLineWidth(parseInt(e.target.value));
              ctxRef.current!.lineWidth = parseInt(e.target.value);
            }}
          />
        </div>
        <div className="m-4 px-4 py-1 bg-green-400 rounded cursor-pointer items-center justify-center text-center" onClick={saveChanges}>
          {requestStatus === "idle" ? <p>Save</p> : <div className="mx-auto">{getRequestStatusSymbol()}</div>}
        </div>
        <div className="m-4 px-4 py-1 bg-blue-400 text-white rounded cursor-pointer" onClick={resetCanvas}>
          Reset
        </div>
      </div>
      <div id="line-width-indicator" className="absolute rounded-full"></div>
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
  let res = await axios.get(`https://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? "localhost"}/images`);
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
