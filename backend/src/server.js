const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const organizationRoutes = require("./routes/organizationRoutes");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Employee Management System API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/organization", organizationRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
