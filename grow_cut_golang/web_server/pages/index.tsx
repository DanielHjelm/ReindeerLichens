import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";

import Link from "next/link";

const Home = ({ paths }: { paths: string }) => {
  console.log({ paths });
  let endpoints = JSON.parse(paths);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex flex-col justify-start items-start">
        <Head>Paths</Head>
        {endpoints.map((path: { fileName: string; hasMask: boolean }, index: number) => (
          <Link className="" href={`/${path.fileName}`} key={path.fileName}>
            {" "}
            <div className="flex space-x-2 justify-center items-center">
              {path.hasMask ? (
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
          </Link>
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
      notFound: true,
    };
  }
  let fileNames = res.data["images"].map((path: any) => path["filename"]);
  console.log({ fileNames: fileNames });

  let masks = fileNames.filter((fileName: string) => fileName.includes("_mask"));
  let images = fileNames.filter((fileName: string) => !fileName.includes("_mask"));

  for (let i = 0; i < images.length; i++) {
    let image = images[i];
    let mask = masks.find((mask: string) => mask.includes(image.split(".")[0]));
    images[i] = { fileName: image, hasMask: mask !== undefined };
  }

  return {
    props: {
      paths: JSON.stringify(images),
    },
  };
}

export default Home;
