import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Batik Wistara WhatsApp REST API",
      version: "1.0.0",
      description: "API untuk mengirim WhatsApp, katalog produk, dan tracking orders."
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" }
      }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: []
};

export function mountSwagger(app) {
  const spec = swaggerJSDoc(options);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
}
