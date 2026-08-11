const User = require("../models/User");

const getDashboard = async (_req, res) => {
  try {
    const baseQuery = { isDeleted: false };
    const [totalEmployees, activeEmployees, inactiveEmployees, departments] =
      await Promise.all([
        User.countDocuments(baseQuery),
        User.countDocuments({ ...baseQuery, status: "Active" }),
        User.countDocuments({ ...baseQuery, status: "Inactive" }),
        User.distinct("department", baseQuery)
      ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      departmentCount: departments.filter(Boolean).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
