const express = require('express');
const S3Router = express.Router();
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();


const s3 = new S3Client({
    region: "eu-north-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

/**
 * @swagger
 *
 * /api/s3/bucket/objects:
 *   get:
 *     description: Get list of object for s3 bucket
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: ok
 *     tags:
 *       - Objects
 */
S3Router.get('/s3/bucket/objects', async function(req, res, next) {
    try {
        const { Contents } = await s3.send(new ListObjectsCommand({ Bucket: 'cloud-guard-storage' }));
        res.json(Contents);

    } catch (error) {
        console.log(error);
    }
});

module.exports = S3Router;