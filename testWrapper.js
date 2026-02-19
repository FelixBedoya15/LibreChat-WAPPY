const { CustomChatGoogleGenerativeAI } = require('@librechat/agents/dist/cjs/llm/google/index.cjs');

async function main() {
    const model = new CustomChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        apiKey: 'fake1,fake2,fake3'
    });

    try {
        const res = await model.invoke('hello');
        console.log("Success:", res);
    } catch (e) {
        console.error("Caught error in script:");
        console.error(e.message);
    }
}

main().catch(console.error);
