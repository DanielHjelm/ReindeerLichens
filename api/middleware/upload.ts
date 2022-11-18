// Multer and Storage in GridFS
import multer from "multer";
import {GridFsStorage} from 'multer-gridfs-storage'

const storage = new GridFsStorage({
  url: "mongodb+srv://admin:" +
  "hejhej" +
  "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority",
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req: any, file: any) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${file.originalname}`;
      return filename;
    }

    return {
      bucketName: "images",
      filename: `${file.originalname}`,
    }

  },});

  module.exports = multer({ storage: storage });