import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
// swagger.js is still CommonJS — fine, esModuleInterop handles this.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerSpec = require("../swagger");

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/authRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import driverRoutes from "./routes/driverRoutes";
import enterpriseRoutes from "./routes/enterpriseRoutes";
import shipmentRoutes from "./routes/shipmentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import walletRoutes from "./routes/walletRoutes";
import fleetOwnerRoutes from "./routes/fleetOwnerRoutes";
import userRoutes from "./routes/userRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import bankRoutes from "./routes/bankRoutes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic abuse protection. Auth routes get a tighter limit since those are
// the endpoints most worth rate-limiting (login/OTP brute-forcing).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again later.",
  },
});

app.use(generalLimiter);

app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/banks", bankRoutes);

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/fleet-owners", fleetOwnerRoutes);
app.use("/api/v1/enterprises", enterpriseRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/drivers", driverRoutes);
app.use("/api/v1/shipments", shipmentRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "EV Fleet Booking API is running" });
});

// 404 and error handler must be registered LAST, in this order.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
