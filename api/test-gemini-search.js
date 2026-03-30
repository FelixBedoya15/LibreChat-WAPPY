const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  require('dotenv').config({ path: '/Users/venta/Documents/GitHub/LibreChat-WAPPY/.env' });
  const apiKey = process.env.GOOGLE_KEY;
  if (!apiKey) throw new Error("No API key");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const requestOptions = {
    contents: [{ role: 'user', parts: [{ text: "qué hora y qué día exactamente es hoy en Colombia?" }] }],
    tools: [{ googleSearch: {} }]
  };

  const result = await model.generateContent(requestOptions);
  console.log("Response with tools:", result.response.text());
}

test().catch(console.error);
