const jwt = require("jsonwebtoken");

// Replace "your_secret_key" with your actual secret key
const secretKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM1MDgxOTI4LCJleHAiOjE3Mzc2NzM5Mjh9.atqYAjcSaNDii4_FIfWKFJ3Q4Iigyy-q1YEzXru7LYQ";

// Replace this with the payload you want to include in the token
const payload = { id: "12345", role: "admin" };

// Generate the token
const token = jwt.sign(payload, secretKey, { expiresIn: "30d" });

console.log("Generated Token:", token);
