import mongoose from "mongoose";
import mongodb from "mongodb";

module.exports = async function () {
  try {
    await mongoose.connect(
      "mongodb+srv://admin:" +
        "hejhej" +
        "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority"
    );
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
    console.log("Failed to connect to MongoDB");
  }
};
