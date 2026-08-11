const User = require("../models/User");

const getOrganizationTree = async (_req, res) => {
  try {
    const employees = await User.find({ isDeleted: false })
      .select("-password")
      .lean();

    const map = {};
    employees.forEach((employee) => {
      map[employee._id.toString()] = { ...employee, children: [] };
    });

    const roots = [];
    employees.forEach((employee) => {
      if (employee.reportingManager) {
        const manager = map[employee.reportingManager.toString()];
        if (manager) manager.children.push(map[employee._id.toString()]);
        else roots.push(map[employee._id.toString()]);
      } else {
        roots.push(map[employee._id.toString()]);
      }
    });

    res.json(roots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOrganizationTree };
