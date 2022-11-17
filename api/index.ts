import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import app from './app';
import http from 'http'

dotenv.config();

const port = process.env.PORT;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// app.get('/', (req: Request, res: Response) => {
//   res.send('Express');
// });

// app.listen(port, () => {
//   console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
// });