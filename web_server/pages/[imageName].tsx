import React, { useEffect, useRef, useState } from "react";
import _Image from "next/image";
import axios, { AxiosResponse } from "axios";
import { getImageAndMask } from "../Utils/db";
import { useRouter } from "next/router";

export default function imageName({ imageName, imageFile }: { imageName: string; imageFile: string }) {
  let [requestStatus, setRequestStatus] = React.useState("idle");
  const ctxRef = useRef<CanvasRenderingContext2D>();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [lineColor, setLineColor] = useState("red");
  const [lineOpacity, setLineOpacity] = useState(100);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  let [url, setUrl] = React.useState(process.env.NEXT_PUBLIC_GOLANG_HOST + "/start");
  let [allowJumps, setAllowJumps] = React.useState(true);
  let [predictionHasBeenMade, setPredictionHasBeenMade] = React.useState(false);
  let [showPrediction, setShowPrediction] = React.useState(true);
  let [predictionState, setPredictionState] = React.useState("idle");
  let [savePredictionRequestStatus, setSavePredictionRequestStatus] = React.useState("idle");
  let router = useRouter();

  async function base64ToFile(b64: string): Promise<File> {
    let blob = await (await fetch(b64)).blob();
    let fileType = b64.split(";")[0].split(":")[1];
    let end = imageName.split(".")[1];
    let _imageName = imageName.split(".")[0] + "_mask." + end;
    let file = new File([blob], _imageName, { type: fileType });

    return file;
  }

  async function saveChanges(): Promise<boolean | undefined> {
    if (savePredictionRequestStatus === "pending") {
      return;
    }
    setSavePredictionRequestStatus("pending");
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    let formdata = new FormData();
    let imageData = ctx.getImageData(0, 0, imageSize.width, imageSize.height);
    let imageDataCopy = new Uint8Array(imageData.data);
    let _mask = blackoutBackground(imageData);
    ctx.putImageData(_mask, 0, 0);
    let fileType = imageName.split(".")[1].toLowerCase() == "jpg" ? "image/jpeg" : "image/png";
    let b64 = canvas.toDataURL(fileType);
    let file = await base64ToFile(b64);

    formdata.append("file", file);
    console.log(`Sending request to ${process.env.NEXT_PUBLIC_IMAGES_API_HOST}/images`);
    imageData.data.set(imageDataCopy);
    ctx.putImageData(imageData, 0, 0);
    let schema = process.env.NEXT_PUBLIC_IMAGES_API_HOST?.includes("127") ? "http" : "https";
    let res = await axios.post(`${schema}://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? ""}/images`, formdata);
    setTimeout(() => {
      setSavePredictionRequestStatus("idle");
    }, 5000);
    if (res.status == 200) {
      setSavePredictionRequestStatus("ok");
      return true;
    } else {
      setSavePredictionRequestStatus("error");
      return false;
    }
  }

  function removeBackground(imageData: ImageData): ImageData {
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      if (r < 100 && g < 100 && b < 100) {
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
        data[i + 3] = 255;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }
    return imageData;
  }

  function canvasToBase64() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const canvasCtx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const canvasClone = canvas.cloneNode() as HTMLCanvasElement;
    const ctx = canvasClone.getContext("2d") as CanvasRenderingContext2D;
    let mask = blackoutBackground(canvasCtx.getImageData(0, 0, canvas.width, canvas.height));

    ctx.putImageData(mask, 0, 0);
    return canvasClone.toDataURL();
  }

  async function sendRequest() {
    if (requestStatus !== "idle") {
      console.log("Request is already in progress");
      return;
    }
    try {
      setRequestStatus("pending");
      let mask = canvasToBase64();
      const response = await fetch(`http://${url}`, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        },
        body: JSON.stringify({
          fileName: imageName,
          mask: mask,
          img: imageFile,
          allowJumps: allowJumps,
        }),
      });
      console.log({ response });
      console.log(await response.text());
      if (response.status == 200 || response.status == 0) {
        setRequestStatus("ok");
        setTimeout(() => {
          // window.location.replace("/");
        }, 2000);
      } else {
        console.log(response.status);
        setRequestStatus("error");
      }
    } catch (error) {
      setRequestStatus("error");
      console.log(error);
    }
    setTimeout(() => {
      setRequestStatus("idle");
    }, 5000);
  }

  // Initialization when the component
  // mounts for the first time
  useEffect(() => {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    handleUserVisibilityChange();

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = lineOpacity;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    window.addEventListener("visibilitychange", handleUserVisibilityChange, true);
    window.addEventListener("beforeunload", NotifyUserClickedBack);

    ctxRef.current = ctx;
    var i = new Image();

    i.src = imageFile;
    i.onload = function () {
      console.log({ width: i.width, height: i.height });
      ctx.drawImage(i, 0, 0);

      setImageSize({ width: i.width, height: i.height });
    };

    return () => {
      window.removeEventListener("visibilitychange", handleUserVisibilityChange, true);
      window.removeEventListener("beforeunload", NotifyUserClickedBack);
    };
  }, [lineColor, lineOpacity, lineWidth]);

  function NotifyUserClickedBack() {
    axios.post("/api/isViewed", { fileName: imageName, isViewed: false }, { validateStatus: (status) => status < 500 });
  }
  function handleUserVisibilityChange() {
    if (document.visibilityState === "hidden") {
      axios.post("/api/isViewed", { fileName: imageName, isViewed: false }, { validateStatus: (status) => status < 500 });
    } else if (document.visibilityState === "visible") {
      axios.post("/api/isViewed", { fileName: imageName, isViewed: true }, { validateStatus: (status) => status < 500 });
    }
  }

  // Function for starting the drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    ctxRef.current!.beginPath();
    ctxRef.current!.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

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

    ctxRef.current!.stroke();
  };

  function getRequestStatusSymbol(status: string) {
    switch (status) {
      case "ok":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white">
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

  return (
    <div className={`relative w-[${imageSize.width}px]`}>
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
        onMouseDown={(e) => {
          if (predictionHasBeenMade) {
            return;
          }
          startDrawing(e);
        }}
        onMouseUp={(e) => {
          if (predictionHasBeenMade) {
            return;
          }
          endDrawing();
        }}
        onMouseMove={(e) => {
          if (predictionHasBeenMade) {
            return;
          }
          draw(e);
        }}
        hidden={predictionHasBeenMade && !showPrediction}
      ></canvas>
      <img src={imageFile} alt="" />

      <div className="fixed block top-1/2 left-[10rem] z-20 p-4 bg-white rounded-sm">
        <input
          type="text"
          placeholder="Enter Endpoint"
          defaultValue={url}
          className="mb-4 rounded border border-gray-300 p-2"
          onChange={(e) => {
            setUrl(e.target.value);
          }}
        />
        <div>
          <label className="inline-flex relative items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              onClick={(e) => {
                setAllowJumps(e.currentTarget.checked);
              }}
              defaultChecked
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Allow Jumps</span>
          </label>
        </div>
        <div
          className=" max-h-[4rem] max-w-[10rem] right-10 bottom-10 z-20 bg-blue-700 border rounded py-2 px-6 text-white font-bold border-black cursor-pointer"
          onClick={sendRequest}
        >
          {requestStatus == "idle" ? <h1>Send</h1> : getRequestStatusSymbol(requestStatus)}
        </div>

        <div
          className="px-4 py-2 bg-cyan-700 rounded mt-4 max-w-[10rem] border shadow cursor-pointer min-h-[2rem]"
          onClick={async () => {
            if (predictionState !== "idle") {
              return;
            }

            setPredictionState("pending");
            let response: AxiosResponse<any, any>;
            try {
              response = await axios(`http://${process.env.NEXT_PUBLIC_PREDICTION_API_HOST}/predict/${imageName}`, {
                method: "GET",

                headers: {
                  "Allow-Control-Allow-Origin": "*",
                },

                validateStatus: (status) => status < 500,
                timeout: 30000,
              });
            } catch (error) {
              setPredictionState("error");
              alert(
                "Error sending prediction request, check console for reason\n\n Have you started the python prediction server located at ReindeerLichens/ (?)\nHave you checked the NEXT_PUBLIC_PREDICTION_API_HOST in .env.local?"
              );
              console.log(error);
              setTimeout(() => {
                setPredictionState("idle");
              }, 1000);
              return;
            }
            if (response!.status !== 200) {
              setPredictionState("error");
              setTimeout(() => {
                setPredictionState("idle");
              }, 1000);
              return;
            }

            let body = response.data;
            let predictionB64 = body["prediction"];

            // Print prediction to canvas
            let canvas = document.getElementById("canvas") as HTMLCanvasElement;
            let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
            let img = new Image();
            let fileType = encodeURIComponent(imageName).split(".")[1];
            if (fileType === "jpg") {
              fileType = "jpeg";
            } else {
              fileType = "png";
            }
            img.src = `data:image/${fileType};base64,${predictionB64}`;
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              let data = removeBackground(ctx.getImageData(0, 0, canvas.width, canvas.height));
              ctx.putImageData(data, 0, 0);
            };
            setPredictionState("ok");
            setPredictionHasBeenMade(true);

            setTimeout(() => {
              setPredictionState("idle");
            }, 1000);
          }}
        >
          {predictionState == "idle" ? (
            predictionHasBeenMade ? (
              <p>Remake prediction</p>
            ) : (
              <p className="text-white font-bold">Predict with model</p>
            )
          ) : (
            getRequestStatusSymbol(predictionState)
          )}
        </div>
        {predictionHasBeenMade && (
          <div>
            <div className="flex py-4">
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  onClick={(e) => {
                    setShowPrediction(e.currentTarget.checked);
                  }}
                  defaultChecked={showPrediction}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show mask</span>
              </label>
            </div>
            <div
              className="flex px-4 py-2 cursor-pointer shadow rounded bg-green-400"
              onClick={() => {
                saveChanges().then((res) => {
                  if (res !== undefined && res === true) {
                    router.push(`/masks/${imageName}`);
                  }
                });
              }}
            >
              {savePredictionRequestStatus === "idle" ? <p>Save and go to mask</p> : getRequestStatusSymbol(savePredictionRequestStatus)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getStaticProps(context: any) {
  const imageName = context.params.imageName;
  console.log(imageName);
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
  let schema = process.env.NEXT_PUBLIC_IMAGES_API_HOST?.includes("127") ? "http" : "https";

  let res = await axios.get(`${schema}://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? "localhost"}/images`);

  if (res.status !== 200) {
    return {
      paths: [],
    };
  }

  let body = res.data;
  // console.log({ body });
  let images = body.images;
  let fileNames = images.map((image: any) => image.filename);
  // console.log({ fileNames });

  return {
    paths: fileNames.map((fileName: string) => ({
      params: {
        imageName: fileName,
      },
    })),
    fallback: false,
  };
}
