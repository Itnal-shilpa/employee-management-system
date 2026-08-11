const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    department: { type: String, default: "" },
    designation: { type: String, default: "" },
    salary: { type: Number, default: 0, min: 0 },
    joiningDate: { type: Date },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    role: { type: String, enum: ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"], default: "EMPLOYEE" },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    profileImage: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
