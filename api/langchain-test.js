const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');

async function test() {
  require('dotenv').config({ path: '/Users/venta/Documents/GitHub/LibreChat-WAPPY/.env' });
  const apiKey = process.env.GOOGLE_KEY;

  const myTool = tool(
    async ({ query }) => {
      return `Custom search result for: ${query}`;
    },
    {
      name: 'CustomSearch',
      description: 'A custom search tool',
      schema: z.object({
        query: z.string().describe('The search query'),
      }),
    }
  );

  const model = new ChatGoogleGenerativeAI({
    modelName: 'gemini-2.5-flash',
    apiKey,
  });

  // Try binding both the LangChain tool and the native Google Search Grounding tool
  try {
    const modelWithTools = model.bind({
      tools: [myTool, { googleSearch: {} }],
    });

    const res = await modelWithTools.invoke([
      { role: 'user', content: 'qué día es hoy y búscalo en custom search' }
    ]);
    
    console.log("Success! Tool response:", res.tool_calls);
    console.log("Content:", res.content);
  } catch (err) {
    console.error("Failed to bind or invoke with mixed tools:", err);
  }
}

test().catch(console.error);
