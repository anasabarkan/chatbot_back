const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const router = express.Router();

dotenv.config(); // Load environment variables

const API_KEY = process.env.GEMINI_API_KEY; // Load API key from environment variables
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generateText"; // Gemini API URL

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid input message. A string message is required." });
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

    // Make a request to the Gemini API
    const response = await axios.post(
      GEMINI_URL,
      {
        prompt: { text: prompt },
        maxOutputTokens: 256, // Adjust the token limit as needed
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`, // API key passed here
        },
      }
    );

    // Extract the raw response text
    const rawReply = response.data.candidates?.[0]?.output || null;

    if (!rawReply) {
      throw new Error("No response generated from Gemini API.");
    }

    console.log("Gemini API Raw Reply:", rawReply);

    // Attempt to parse the JSON response from the API
    let taskData;
    try {
      taskData = JSON.parse(rawReply.match(/\{[\s\S]*\}/)?.[0]); // Extract JSON content
      if (!taskData.title || !taskData.description || !taskData.priority) {
        throw new Error("Missing required fields in the AI-generated task data.");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", rawReply);
      throw new Error("Invalid JSON format received from Gemini API.");
    }

    // Send the parsed JSON response back to the client
    res.status(200).json({ task: taskData });
  } catch (error) {
    console.error("Error communicating with Gemini API:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

module.exports = router;
