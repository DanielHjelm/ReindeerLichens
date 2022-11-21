import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import fs from "fs";
import Link from "next/link";

const Home = ({ paths }: { paths: string }) => {
  console.log({ paths });
  let endpoints = JSON.parse(paths);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>Paths</Head>
      {endpoints.map((path: string, index: number) => (
       <Link href={`/${path}`} > <p id={index.toString()}>{path}</p></Link>
      ))}
    </div>
  );
};

export async function getServerSideProps() {
  let paths = fs.readdirSync("../../images");
  let result = JSON.stringify(paths);

  return {
    props: {
      paths: result,
    },
  };
}

export default Home;
