import express, { Express, Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import * as url from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from "helmet";
import logger from 'morgan';
import rfs from 'rotating-file-stream';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFound } from "./middlewares/error.ts";
import { S3Router } from './routes/s3.ts';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

dotenv.config();
const app: Express = express()
const port = process.env.PORT || 3000;

// serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable all cors requests
app.use(cors());

// Secure the app by setting various HTTP headers
app.use(helmet());

// Logger middleware to console and to single file with 1d rotation
const loggerPath = path.join(__dirname, 'logs/server.log');
if (fs.existsSync(loggerPath)) {
  fs.unlinkSync(loggerPath);
}
const serverLogStream = rfs.createStream('server.log', { maxFiles: 5, size: '2M', path: path.join(__dirname, 'logs') });
app.use(logger('combined'));
app.use(logger('combined', { stream: serverLogStream }));

// used to parse the incoming requests with JSON payloads and is based upon the bodyparser
app.use(express.json());

// Swagger configuration
const file  = fs.readFileSync('./docs/swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Static website
app.get('/', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/index.html');
})

app.use('/api/s3', S3Router)

// error middlewares
app.use(notFound);
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})