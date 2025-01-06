const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Load Gemini API Key
const geminiAPIKey = process.env.GEMINI_API_KEY;

// Initialize Gemini API Client
const genAI = new GoogleGenerativeAI(geminiAPIKey);

// Chatbot Route
app.post("/api/chatbot", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid input message." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Error communicating with Gemini API:", error.message);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {}) // Remove deprecated options
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit the process if the connection fails
  });

// Import routes
const authRoutes = require("./routes/auth");
const chatbotRoutes = require("./routes/chatbot");
const taskRoutes = require("./routes/task");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/tasks", taskRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
