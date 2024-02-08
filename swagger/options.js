const swaggerOptions = {
  definition: {
    swagger: "2.0",
    info: {
      title: "Cloud Guard API",
      version: "0.1.0",
      description: "The Cloud Guard server that provide API for the client. Made with NodeJS, Express and Swagger.",
    },
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerOptions