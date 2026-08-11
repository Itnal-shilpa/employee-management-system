const bcrypt = require("bcryptjs");
const User = require("../models/User");

const getEmployees = async (req, res) => {
  try {
    const {
      search = "",
      department,
      role,
      status,
      sort = "name",
      page = 1,
      limit = 10
    } = req.query;

    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.status = status;

    const sortOption = sort === "joiningDate" ? { joiningDate: -1 } : { name: 1 };
    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNumber - 1) * pageSize;

    const [employees, total] = await Promise.all([
      User.find(query)
        .populate("reportingManager", "name employeeId")
        .select("-password")
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(query)
    ]);

    res.json({
      employees,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      isDeleted: false
    })
      .populate("reportingManager", "name employeeId email")
      .select("-password");

    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    const {
      employeeId, name, email, password, phone, department,
      designation, salary, joiningDate, status, role,
      reportingManager, profileImage
    } = req.body;

    if (!employeeId || !name || !email || !password || !department || !designation) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (salary !== undefined && Number(salary) < 0) {
      return res.status(400).json({ message: "Salary cannot be negative" });
    }

    if (role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can assign Super Admin role" });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId }]
    });
    if (existing) return res.status(400).json({ message: "Email or Employee ID already exists" });

    if (reportingManager) {
      const manager = await User.findOne({ _id: reportingManager, isDeleted: false });
      if (!manager) return res.status(400).json({ message: "Reporting manager not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await User.create({
      employeeId, name, email: email.toLowerCase(), password: hashedPassword,
      phone, department, designation, salary, joiningDate, status, role,
      reportingManager, profileImage
    });

    const result = employee.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email or Employee ID already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (req.user.role === "EMPLOYEE") {
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "You can edit only your own profile" });
      }
      ["name", "phone", "profileImage"].forEach((field) => {
        if (req.body[field] !== undefined) employee[field] = req.body[field];
      });
    } else {
      const fields = [
        "name", "email", "phone", "department", "designation",
        "salary", "joiningDate", "status", "profileImage"
      ];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) employee[field] = req.body[field];
      });

      if (req.body.role !== undefined) {
        if (req.body.role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
          return res.status(403).json({ message: "Only Super Admin can assign Super Admin" });
        }
        employee.role = req.body.role;
      }
    }

    await employee.save();
    const result = employee.toObject();
    delete result.password;
    res.json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can delete employees" });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    employee.isDeleted = true;
    await employee.save();

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignManager = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can assign managers" });
    }

    const employee = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const { managerId = null } = req.body;

    if (managerId && managerId.toString() === req.params.id) {
      return res.status(400).json({ message: "Employee cannot report to itself" });
    }

    if (managerId) {
      let current = await User.findOne({ _id: managerId, isDeleted: false });
      if (!current) return res.status(404).json({ message: "Manager not found" });

      const visited = new Set();
      while (current && current.reportingManager) {
        const currentId = current._id.toString();
        if (visited.has(currentId)) {
          return res.status(400).json({ message: "Invalid existing reporting cycle" });
        }
        visited.add(currentId);

        if (current.reportingManager.toString() === employee._id.toString()) {
          return res.status(400).json({ message: "Circular reporting is not allowed" });
        }
        current = await User.findById(current.reportingManager);
      }
    }

    employee.reportingManager = managerId;
    await employee.save();

    res.json({ message: "Reporting manager updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportees = async (req, res) => {
  try {
    const employees = await User.find({
      reportingManager: req.params.id,
      isDeleted: false
    }).select("-password");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignManager,
  getReportees
};
