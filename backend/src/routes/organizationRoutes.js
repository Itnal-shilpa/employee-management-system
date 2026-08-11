const express = require("express");
const { getOrganizationTree } = require("../controllers/organizationController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.get("/tree", protect, getOrganizationTree);

module.exports = router;
