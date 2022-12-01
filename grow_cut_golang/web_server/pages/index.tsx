import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";

import Link from "next/link";
import imageName from "./[imageName]";

const Home = ({ paths }: { paths: string }) => {
  let endpoints = JSON.parse(paths);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-xl mb-2">Alla bilder som finns i databasen är länkade till nedan:</h1>
        <div className="flex flex-col items-start mx-auto mb-10 text-xs">
          <div className="flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p>Betyder att bilden har en sparad mask</p>
          </div>
          <div className="flex items-start justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <p>Betyder att bilden inte har en sparad mask</p>
          </div>
          <div className="flex items-start justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-500">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>

            <p>Betyder att en mask håller på att tas fram</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start items-start">
        <Head>Paths</Head>
        {endpoints.length == 0 && <h1>No Images Found</h1>}
        {endpoints.length > 0 &&
          endpoints.map((path: { fileName: string; hasMask: boolean; inProgress: boolean }, index: number) => (
            <div key={path.fileName} className="flex flex-row items-end w-full justify-between  min-w-[50%]">
              <a className="" href={`/${path.fileName}`}>
                {" "}
                <div className="flex space-x-2 justify-center items-center">
                  {path.inProgress ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-yellow-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  ) : path.hasMask ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-green-700"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-red-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  )}
                  <p id={index.toString()}>{path.fileName}</p>
                </div>
              </a>
              {path.hasMask && (
                <a className="" href={`/masks/${path.fileName}`}>
                  To mask
                </a>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  console.log("getServerSideProps in pages/index.tsx");
  let res = await axios.get(`https://${process.env.NEXT_PUBLIC_IMAGES_API_HOST ?? "localhost"}/images`, {
    validateStatus: (status) => status < 500,
  });

  if (res.status !== 200) {
    console.log(res.data);
    return {
      props: {
        paths: JSON.stringify([]),
      },
    };
  }
  let fileNames = res.data["images"].map((path: any) => path["filename"]);
  // console.log({ fileNames: fileNames });

  let masks = fileNames.filter((fileName: string) => fileName.includes("_mask"));
  let images = fileNames.filter((fileName: string) => !fileName.includes("_mask"));

  for (let i = 0; i < images.length; i++) {
    let image = images[i];
    console.log({ image });
    let mask = masks.find((mask: string) => mask.includes(image.split(".")[0]));
    let inProgress = res.data["images"].find((item: any) => item.filename == image)["inProgress"] as boolean;

    images[i] = { fileName: image, hasMask: mask !== undefined, inProgress: inProgress };
  }

  console.log({ images: images });

  return {
    props: {
      paths: JSON.stringify(images),
    },
  };
}

export default Home;
