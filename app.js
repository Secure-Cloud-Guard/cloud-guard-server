const express = require('express')
const path = require('path');
const cors = require('cors')
const bodyParser = require("body-parser")
const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express");
const S3Router = require('./routes/s3');
const swaggerOptions = require('./swagger/options')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000;

// serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable all cors requests
app.use(cors())

// Swagger configuration
const specs = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

app.use('/api', S3Router)

app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})