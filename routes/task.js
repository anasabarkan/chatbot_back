const express = require("express");
const { create, getAll, update, remove } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, create); // Create Task
router.get("/", protect, getAll); // Get All Tasks
router.put("/:id", protect, update); // Update Task
router.delete("/:id", protect, remove); // Delete Task

module.exports = router;
