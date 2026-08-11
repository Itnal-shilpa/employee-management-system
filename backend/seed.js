const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./src/models/User");

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});

    const password = await bcrypt.hash("Password123", 10);

    const admin = await User.create({
      employeeId: "EMP001",
      name: "Super Admin",
      email: "admin@ems.com",
      password,
      phone: "9876543210",
      department: "Management",
      designation: "Super Admin",
      salary: 100000,
      joiningDate: new Date("2024-01-01"),
      status: "Active",
      role: "SUPER_ADMIN"
    });

    const hr = await User.create({
      employeeId: "EMP002",
      name: "HR Manager",
      email: "hr@ems.com",
      password,
      phone: "9876543211",
      department: "Human Resources",
      designation: "HR Manager",
      salary: 70000,
      joiningDate: new Date("2024-02-01"),
      status: "Active",
      role: "HR_MANAGER",
      reportingManager: admin._id
    });

    await User.create([
      {
        employeeId: "EMP003",
        name: "John Employee",
        email: "employee@ems.com",
        password,
        phone: "9876543212",
        department: "Engineering",
        designation: "Software Developer",
        salary: 50000,
        joiningDate: new Date("2025-01-15"),
        status: "Active",
        role: "EMPLOYEE",
        reportingManager: hr._id
      },
      {
        employeeId: "EMP004",
        name: "Jane Employee",
        email: "jane@ems.com",
        password,
        phone: "9876543213",
        department: "Finance",
        designation: "Financial Analyst",
        salary: 45000,
        joiningDate: new Date("2025-03-10"),
        status: "Inactive",
        role: "EMPLOYEE",
        reportingManager: hr._id
      }
    ]);

    console.log("Seed complete.");
    console.log("Admin: admin@ems.com / Password123");
    console.log("HR: hr@ems.com / Password123");
    console.log("Employee: employee@ems.com / Password123");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
