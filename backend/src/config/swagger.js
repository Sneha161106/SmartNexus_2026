const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Expense Reimbursement API",
      version: "1.0.0",
      description: "API for AI-powered expense reimbursement workflows"
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:5001"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: []
});

module.exports = swaggerSpec;
