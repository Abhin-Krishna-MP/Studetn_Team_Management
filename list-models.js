require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Since we need to call the REST API natively to list models because the SDK might not expose listModels directly easily or it might, let's just make a fetch call.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
            console.log(`- ${m.name} (${m.displayName})`);
        }
    });
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listModels();
