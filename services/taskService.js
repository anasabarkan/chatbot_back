const Task = require("../models/Task");

const createTask = async ({ userId, title, description, dueDate, priority }) => {
  return await Task.create({ user: userId, title, description, dueDate, priority });
};

const getTasks = async (userId) => {
  return await Task.find({ user: userId });
};

const updateTask = async (taskId, updates) => {
  return await Task.findByIdAndUpdate(taskId, updates, { new: true });
};

const deleteTask = async (taskId) => {
  await Task.findByIdAndDelete(taskId);
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
