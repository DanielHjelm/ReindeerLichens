import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import app from './app';
import dbConnection from "./db";


dotenv.config();

dbConnection();

const port = process.env.PORT;

// const server = http.createServer(app);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});


// // Connect to MongoDB
// mongoose.connect(
//   "mongodb+srv://admin:" +
//     "hejhej" +
//     "@reindeerlichens.ro1gjeu.mongodb.net/?retryWrites=true&w=majority"
// );