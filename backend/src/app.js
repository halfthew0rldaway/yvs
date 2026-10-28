require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const perangkatRoutes = require("./routes/perangkat.routes");
const tiketServisRoutes = require("./routes/tiket-servis.routes");
const diagnosisRoutes = require("./routes/diagnosis.routes");
const logPerbaikanRoutes = require("./routes/log-perbaikan.routes");
const sparepartRoutes = require("./routes/sparepart.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const trackingRoutes = require("./routes/tracking.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const brandRoutes = require("./routes/brand.routes");
const userRoutes = require("./routes/user.routes");
const repairWikiRoutes = require("./routes/repair-wiki.routes");
const notificationRoutes = require("./routes/notification.routes");
const loanerRoutes = require("./routes/loaner.routes");
const rmaRoutes = require("./routes/rma.routes");
const realtimeRoutes = require("./routes/realtime.routes");
const databaseRoutes = require("./routes/database.routes");
const staffSignatureRoutes = require("./routes/staffSignature.routes");
const sopRoutes = require("./routes/sop.routes");
const recruitmentRoutes = require("./routes/recruitment.routes");
const supplierRoutes = require("./routes/supplier.routes");
const activityLogger = require("./middleware/activityLogger");
const sanitizeRequest = require("./middleware/sanitizeRequest");
const errorHandler = require("./middleware/errorHandler");
const { generalApiLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Docker / Caddy reverse proxy (essential for correct IP in rate limiter & logs)
app.set("trust proxy", 1);

// 1. Security Headers (configured to allow cross-origin assets for uploads)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. HTTP Request Logger (colored concise output in dev, standard combined in prod)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 3. Response Compression (Gzip / Brotli)
app.use(compression());

// 4. CORS
app.use(cors());

// 5. Body Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 6. Global Request Sanitizer (Deep trim, normalize common fields, XSS protection)
app.use(sanitizeRequest);

// 7. General API Rate Limiter
app.use("/api", generalApiLimiter);

// 8. Static Uploads
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// 9. Activity Logger
app.use(activityLogger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/perangkat", perangkatRoutes);
app.use("/api/tiket-servis", tiketServisRoutes);
app.use("/api/sparepart", sparepartRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/log-perbaikan", logPerbaikanRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/repair-wiki", repairWikiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/loaner", loanerRoutes);
app.use("/api/rma", rmaRoutes);
app.use("/api/realtime", realtimeRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/staff-signatures", staffSignatureRoutes);
app.use("/api/sop", sopRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/suppliers", supplierRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ 
        message: "Serv.io API - Running",
        environment: process.env.NODE_ENV || "development",
        status: "healthy"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Centralized Global Error Handler
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server berjalan di port ${PORT}`);
});

module.exports = app;
