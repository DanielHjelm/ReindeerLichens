import React, { LegacyRef, useEffect } from "react";
import { getImageAndMask } from "../../Utils/db";
import axios from "axios";

export default function Mask({ mask, image, fileName }: { mask: string; image: string; fileName: string }) {
  let [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
  let [maskSize, setMaskSize] = React.useState({ width: 0, height: 0 });
  let [lineWidth, setLineWidth] = React.useState(20);
  let [requestStatus, setRequestStatus] = React.useState("idle");
  let [updateRequestStatus, setUpdateRequestStatus] = React.useState("idle");
  let [starRequstStatus, setStarRequestStatus] = React.useState("idle");
  let [showMask, setShowMask] = React.useState(true);
  let [starred, setStarred] = React.useState(false);
  const ctxRef = React.useRef<CanvasRenderingContext2D>();

  //   let [isDrawing, setIsDrawing] = React.useState(false);
  let isDrawing = false;

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

  async function getStarStatus() {
    setStarRequestStatus("pending");
    let response = await fetch(`http://localhost:3000/api/star?fileName=${encodeURIComponent(fileName)}`, {
      method: "GET",
      mode: "no-cors",
      headers: {
        "Allow-Control-Allow-Origin": "*",
      },
    });
    let star: boolean;

    if (response.status === 200) {
      let body = await response.json();

      console.log({ body });
      star = body.star;
      setStarRequestStatus("idle");
      setStarred(star);
    } else {
      console.log({ response: await response.json() });
      setStarRequestStatus("error");
      setTimeout(() => {
        setStarRequestStatus("idle");
        setStarred(star);
      }, 2000);
    }
    resetCanvas();
  }

  useEffect(() => {
    getStarStatus();
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
        ctx.drawImage(msk, 0, 0);
        const imageData = ctx.getImageData(0, 0, msk.width, msk.height);
        let mask = removeBackground(imageData);

        ctx.putImageData(mask, 0, 0);

        setMaskSize({ width: msk.width, height: msk.height });
      };
    }
  }, []);

  function resetCanvas() {
    const msk = new Image();
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    let addBtn = document.getElementById("add-btn")!;
    let addText = document.getElementById("add-text")!;
    addText.innerText = "Add";
    addBtn.style.backgroundColor = "white";
    addBtn.style.color = "#61A5FB";
    addBtn.style.borderColor = "#61A5FB";
    msk.src = mask;
    ctxRef.current!.lineWidth = lineWidth;
    ctxRef.current!.lineCap = "round";
    ctxRef.current!.strokeStyle = "black";
    msk.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(msk, 0, 0);
      const imageData = ctx.getImageData(0, 0, msk.width, msk.height);
      let mask = removeBackground(imageData);

      ctx.putImageData(mask, 0, 0);

      setMaskSize({ width: msk.width, height: msk.height });
    };
  }

  async function HandleAddToMask() {
    let addBtn = document.getElementById("add-btn")!;
    if (addBtn.innerText === "Send") {
      if (updateRequestStatus !== "idle") {
        return;
      }
      let canvas = document.getElementById("canvas") as HTMLCanvasElement;
      let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let mask = blackoutBackground(imageData);
      let pixelData = [];
      for (let i = 0; i < mask.data.length; i += 4) {
        if (imageData.data[i + 3] !== 0) {
          let x = (i / 4) % canvas.width;
          let y = Math.floor(i / 4 / canvas.width);

          pixelData.push({ x: x, y: y });
        }
      }
      let data = {
        fileName: fileName,
        pixels: pixelData,
        img: image,
      };
      try {
        setUpdateRequestStatus("pending");
        let response = await fetch(`http://${process.env.NEXT_PUBLIC_GOLANG_HOST}/start`, {
          method: "POST",
          mode: "no-cors",

          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(data),
        });
        console.log(response);
        if (response.status === 200 || response.status === 0) {
          setUpdateRequestStatus("ok");
          setTimeout(() => {
            window.location.replace("/");
          }, 2000);
        }
        setTimeout(() => {
          setUpdateRequestStatus("idle");
        }, 4000);
        return;
      } catch {
        alert(
          `Error sending request, have you set the golang host property correctly in .env.local?\nYou are currently using ${process.env.NEXT_PUBLIC_GOLANG_HOST}`
        );
      }
    }
    let addText = document.getElementById("add-text")!;
    addText.innerText = "Send";
    addBtn.style.backgroundColor = "#4ADE80";
    addBtn.style.color = "white";
    ctxRef.current!.lineWidth = 3;
    addBtn.style.borderColor = "#ffffff";
    ctxRef.current!.strokeStyle = "red";
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
    setRequestStatus("pending");

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
  function getRequestStatusSymbol(status: string) {
    switch (status) {
      case "ok":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-black">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        );
        break;
      case "pending":
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

  async function handleSaveStar() {
    console.log("Saving star");
    setStarRequestStatus("pending");
    let payload = {
      fileName: fileName,
      star: !starred,
    };
    console.log({ payload });
    let response = await axios.post(`https://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? ""}/star`, payload, { validateStatus: (status) => status < 500 });
    if (response.status == 200) {
      setStarRequestStatus("ok");
      setStarred(!starred);
    } else {
      setStarRequestStatus("error");
      console.log(response.data);
    }
    setTimeout(() => {
      setStarRequestStatus("idle");
    }, 1000);
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
        hidden={!showMask}
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
        <div className="flex space-x-1 mb-4">
          <p className="text-sm">Star this image (Good enough for ML)</p>
          <div onClick={() => handleSaveStar()} className="cursor-pointer w-6 h-6">
            {starRequstStatus === "idle" ? getStarredIcon(starred) : getRequestStatusSymbol(starRequstStatus)}
          </div>
        </div>
        <div>
          <label className="inline-flex relative items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" onClick={() => setShowMask((prev) => !prev)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Hide mask</span>
          </label>
        </div>

        {showMask && (
          <div>
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
              {requestStatus === "idle" ? <p>Save</p> : <div className="mx-auto">{getRequestStatusSymbol(requestStatus)}</div>}
            </div>
            <div className="m-4 px-4 py-1 bg-blue-400 text-white rounded cursor-pointer justify-center items-center text-center" onClick={resetCanvas}>
              Reset
            </div>
            <div id="add-btn" className="m-4 px-4 py-1 border-blue-400 border-2  text-blue-400 rounded cursor-pointer text-center" onClick={HandleAddToMask}>
              {updateRequestStatus === "idle" ? <p id="add-text">Add</p> : <div className="mx-auto">{getRequestStatusSymbol(updateRequestStatus)}</div>}
            </div>
          </div>
        )}
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

function getStarredIcon(starred: boolean) {
  console.log("Getting icon");
  if (starred) {
    return <StarredIcon />;
  } else {
    return <UnStarredIcon />;
  }
}

function StarredIcon() {
  return (
    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
    </svg>
  );
}

function UnStarredIcon() {
  return (
    <svg className="w-5 h-5 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
    </svg>
  );
}
