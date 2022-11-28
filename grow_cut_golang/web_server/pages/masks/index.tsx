import Link from "next/link";
import path from "path";
import React from "react";
import axios from "axios";

export default function Masks({ images }: { images: string[] }) {
  return (
    <div className="flex flex-col h-screen  justify-center items-center">
      {images.map((mask: any) => (
        <div key={mask} className="">
          <Link href={`/masks/${mask}`}>
            <h1 className="text-black">{mask}</h1>
          </Link>
        </div>
      ))}
    </div>
  );
}

export async function getStaticProps() {
  console.log("getStaticProps in pages/masks/index.tsx");
  let res = await axios.get(`http://${process.env.IMAGES_API_HOST ?? "localhost"}/images`);

  if (res.status !== 200) {
    return {
      notFound: true,
    };
  }

  let imageNames = res.data.images.map((image: any) => image.filename);

  console.log({ paths: imageNames });

  // console.log(res);
  // console.log(res);
  return {
    props: {
      images: imageNames,
    },
  };
}
