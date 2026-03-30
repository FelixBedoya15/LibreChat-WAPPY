const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  require('dotenv').config({ path: '/Users/venta/Documents/GitHub/LibreChat-WAPPY/.env' });
  const apiKey = process.env.GOOGLE_KEY; 
  if (!apiKey) return console.log("NO KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Test with flash-lite
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview",
    tools: [{ googleSearch: {} }] 
  });

  try {
    const result = await model.generateContent("qué hora y qué día exactamente es hoy?");
    console.log("Lite Response:", result.response.text());
  } catch(e) {
    console.log("Lite Error:", e.message);
  }
}

test().catch(console.error);
