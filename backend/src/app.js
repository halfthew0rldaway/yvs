require("dotenv").config();
const express = require("express");
const cors = require("cors");

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
const activityLogger = require("./middleware/activityLogger");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Activity Logger
app.use(activityLogger);

// Routes
app.use("/api/auth", authRoutes);
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

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Serv.io API - Running" });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

module.exports = app;
