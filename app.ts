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
import { errorHandler, notFound } from "./src/middlewares/error";
import { S3Router } from './src/routes/s3';
import { CognitoRouter } from "./src/routes/cognito";
import { validateAuth } from "./src/middlewares/auth";
import { setUserId } from "./src/middlewares/setUserId";
import { setSSEkey } from "./src/middlewares/setSSEkey";


dotenv.config();

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app: Express = express()
const port = process.env.PROD_PORT || process.env.PORT || 3000;

// serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable all cors requests
// app.use(cors());

app.all('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  next();
});

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.sendStatus(200);
});

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

// Auth middleware to check if user token is valid before protected apis
app.all('/api/*', validateAuth, setUserId, setSSEkey)

app.use('/api/s3', S3Router)
app.use('/api/cognito', CognitoRouter)

// error middlewares
app.use(notFound);
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})