import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";
import fs from "fs";
import Link from "next/link";

const Home = ({ paths }: { paths: string }) => {
  console.log({ paths });
  let endpoints = JSON.parse(paths);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex flex-col justify-start items-start">
        <Head>Paths</Head>
        {endpoints.map((path: { fileName: string; hasMask: boolean }, index: number) => (
          <Link className="" href={`/${path.fileName}`}>
            {" "}
            <div className="flex space-x-2 justify-center items-center">
              {path.hasMask ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-geen-400"
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
          </Link>
        ))}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  console.log("getServerSideProps in pages/index.tsx");
  let res = await axios.get(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images`);

  if (res.status !== 200) {
    return {
      notFound: true,
    };
  }
  let fileNames = res.data["images"].map((path: any) => path["filename"]);
  console.log({ fileNames: fileNames });

  for (let i = 0; i < fileNames.length; i++) {
    let fileName = fileNames[i];
    if (!fileName.includes("mask")) {
      let end = fileName.split(".")[1];
      if (fileNames.includes(fileName.replace(`.${end}`, `_mask.${end}`))) {
        fileNames[i] = {
          fileName: fileName,
          hasMask: true,
        };
      } else {
        fileNames[i] = {
          fileName: fileName,
          hasMask: false,
        };
      }
    }
  }

  return {
    props: {
      paths: JSON.stringify(fileNames),
    },
  };
}

export default Home;
