const express = require("express");
const {
  getEmployees, getEmployee, createEmployee, updateEmployee,
  deleteEmployee, assignManager, getReportees
} = require("../controllers/employeeController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getEmployees);
router.post("/", protect, authorize("SUPER_ADMIN", "HR_MANAGER"), createEmployee);
router.get("/:id/reportees", protect, getReportees);
router.patch("/:id/manager", protect, authorize("SUPER_ADMIN"), assignManager);
router.put("/:id", protect, updateEmployee);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deleteEmployee);
router.get("/:id", protect, getEmployee);

module.exports = router;
