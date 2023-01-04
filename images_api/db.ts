import mongoose from "mongoose";
import mongodb from "mongodb";
import { moveMessagePortToContext } from "worker_threads";

export default async function () {
  try {
    await mongoose.connect(process.env.MONGO_DB!);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
    console.log("Failed to connect to MongoDB");
  }
}
