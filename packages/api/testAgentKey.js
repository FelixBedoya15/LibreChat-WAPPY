const { CustomChatGoogleGenerativeAI } = require('@librechat/agents');

async function test() {
    console.log("Instantiating CustomChat...");
    const agent = new CustomChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        apiKey: 'fake1,fake2,fake3'
    });
    console.log("Agent apiKey:", agent.apiKey);
    console.log("Agent _apiKeys:", agent._apiKeys);
    console.log("Agent client apiKey:", agent.client?.apiKey);

    // Try to rotate
    console.log("Rotating...");
    agent.rotateKey();
    console.log("Agent apiKey after rotate:", agent.apiKey);
    console.log("Agent client apiKey after rotate:", agent.client?.apiKey);
}

test().catch(console.error);
