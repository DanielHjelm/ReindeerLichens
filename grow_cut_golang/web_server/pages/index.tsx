import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";

import Link from "next/link";
import imageName from "./[imageName]";
import { stringify } from "querystring";

interface Data {
  fileName: string;
  hasMask: boolean;
  inProgress: boolean;
  uploadDate: string;
  star: boolean;
  isViewed: boolean;
}

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
          <div className="flex items-start justify-center space-x-2">
            <StarredIcon />

            <p>Betyder att en mask är bedömd tillräckligt bra för ML</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start items-start">
        <Head>Paths</Head>
        {endpoints.length == 0 && <h1>No Images Found</h1>}
        {endpoints.length > 0 &&
          endpoints
            .sort((a: Data, b: Data) => {
              return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
            })
            .map((path: Data, index: number) => (
              <div key={path.fileName} title={path.uploadDate} className="flex flex-row items-end w-full justify-between  min-w-[50%]">
                <a className="flex space-x-4 justify-center items-center text-center" href={`/${path.fileName}`}>
                  {" "}
                  {getStarredIcon(path.star)}
                  <div>
                    {path.isViewed && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
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

function getStarredIcon(starred: boolean) {
  if (starred) {
    return <StarredIcon />;
  } else {
    return <UnStarredIcon />;
  }
}

function StarredIcon() {
  return (
    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
    </svg>
  );
}

function UnStarredIcon() {
  return (
    <svg className="w-4 h-4 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
    </svg>
  );
}

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
    let mask = masks.find((mask: string) => mask.includes(image.split(".")[0]));
    let inProgress = res.data["images"].find((item: any) => item.filename == image)["inProgress"] as boolean;
    let uploadDate = res.data["images"].find((item: any) => item.filename == image)["uploadDate"] as string;
    let star = res.data["images"].find((item: any) => item.filename == image)["star"] as boolean;
    let isViewed = res.data["images"].find((item: any) => item.filename == image)["isViewed"] as boolean;
    images[i] = { fileName: image, hasMask: mask !== undefined, inProgress: inProgress, uploadDate: uploadDate, star: star, isViewed: isViewed };
  }

  // console.log({ images: images });

  return {
    props: {
      paths: JSON.stringify(images),
    },
  };
}

export default Home;
