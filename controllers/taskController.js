const Task = require("../models/Task"); // Task model
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiAPIKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiAPIKey);

// Create Task from LLM JSON Response
const create = async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid input message. A string is required." });
  }

  try {
    const prompt = `
      Create a task in strict JSON format with the following fields:
      {
        "title": "string",
        "description": "string",
        "priority": "low | medium | high",
        "dueDate": "YYYY-MM-DD or null"
      }
      Input: "${message}"
      Respond with JSON only. If you cannot generate a task, respond with {"error": "Cannot generate task."}.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const rawReply = result.response.text();
    console.log("Raw Reply from Gemini:", rawReply);

    let taskData;
    try {
      // Extract and parse JSON
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonMatch) {
        throw new Error("No valid JSON found in LLM response.");
      }
      taskData = JSON.parse(jsonMatch);

      // Validate task data
      if (!taskData.title || !taskData.description || !taskData.priority) {
        throw new Error("Missing required fields in AI-generated task data.");
      }
    } catch (error) {
      console.error("Error parsing LLM response:", rawReply);
      return res.status(500).json({ error: "Invalid JSON format from LLM." });
    }

    // Save task to the database
    const newTask = new Task({
      user: req.user.id,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      dueDate: taskData.dueDate || null,
      status: "pending",
    });

    const savedTask = await newTask.save();
    res.status(201).json({ message: "Task created successfully", task: savedTask });
  } catch (error) {
    console.error("Error creating task:", error.message);
    res.status(500).json({ error: "Failed to process the request." });
  }
};

// Get All Tasks
const getAll = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
};

// Update Task
const update = async (req, res) => {
  const { id } = req.params;
  const { updateInstruction } = req.body; // Natural language update instruction

  if (!id) {
    return res.status(400).json({ error: "Task ID is required." });
  }

  if (!updateInstruction || typeof updateInstruction !== "string") {
    return res.status(400).json({ error: "Update instruction is required as a string." });
  }

  try {
    // Generate update data using LLM
    const prompt = `
      Based on the following instruction, update the task data in strict JSON format:
      Instruction: "${updateInstruction}"
      Fields to update: { "title", "description", "priority", "status", "dueDate" }
      Respond in the following format:
      {
        "title": "string (optional)",
        "description": "string (optional)",
        "priority": "low | medium | high (optional)",
        "status": "pending | completed (optional)",
        "dueDate": "YYYY-MM-DD or null (optional)"
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const rawReply = result.response.text();
    console.log("Raw Reply from Gemini:", rawReply);

    let updateData;
    try {
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonMatch) {
        throw new Error("No valid JSON found in LLM response.");
      }
      updateData = JSON.parse(jsonMatch);

      // Remove null fields to avoid validation errors
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === null) {
          delete updateData[key];
        }
      });
    } catch (error) {
      console.error("Error parsing LLM response:", rawReply);
      return res.status(500).json({ error: "Invalid JSON format from LLM." });
    }

    // Update the task in MongoDB
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ error: "Failed to update task." });
  }
};


// Remove Task
const remove = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Task ID is required." });
  }

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.status(500).json({ error: "Failed to delete task." });
  }
};

module.exports = { create, getAll, update, remove };
