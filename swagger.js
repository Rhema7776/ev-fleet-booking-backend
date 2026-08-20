const swaggerJsdoc = require("swagger-jsdoc");
const swaggerDefinition = {
    openapi: "3.0.0",

    info: {
        title: "EV Fleet Booking API",
        version: "1.0.0",
        description:
            "API documentation for the EV Fleet Booking System.",
    },

    servers: [
        {
            url:
                process.env.API_BASE_URL ||
                "http://localhost:3000",
            description: "Current API environment",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
};

const options = {
    definition: swaggerDefinition,
    apis: [
        // src/*.ts — used in dev (tsx runs directly from src/).
        "./src/routes/*.js",
        "./src/routes/*.ts",
        "./src/controllers/*.js",
        "./src/controllers/*.ts",
        // dist/*.js — used in production. The Docker runtime image only
        // contains compiled dist/ output, not the src/ folder at all, so
        // without this, swagger-jsdoc finds zero files to scan in a
        // deployed container and silently reports "No operations defined
        // in spec!" even though the app itself works fine. tsc keeps
        // comments in the compiled output by default (removeComments
        // isn't set), so the @swagger blocks survive compilation intact.
        "./dist/routes/*.js",
        "./dist/controllers/*.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

// swagger-jsdoc drops/overwrites top-level `components` in some versions —
// force it back in from our own definition.
swaggerSpec.components = {
    ...swaggerSpec.components,
    ...swaggerDefinition.components,
    securitySchemes: {
        ...(swaggerSpec.components && swaggerSpec.components.securitySchemes),
        ...swaggerDefinition.components.securitySchemes,
    },
};


module.exports = swaggerSpec;
