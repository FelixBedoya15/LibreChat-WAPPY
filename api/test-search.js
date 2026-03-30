const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_KEY);
async function run() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }]
    });
    const result = await model.generateContent("¿Quién ganó el super bowl en 2025?");
    console.log(result.response.text());
    
    // Check groundings
    const searchChunks = result.response.candidates[0]?.groundingMetadata?.groundingChunks;
    if (searchChunks) console.log("USED WEB SEARCH!");
  } catch (e) {
    console.error(e);
  }
}
run();
