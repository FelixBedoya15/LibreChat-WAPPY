const { llmProviders } = require('@librechat/agents/dist/cjs/llm/providers.cjs');

async function main() {
    const CustomChatGoogleGenerativeAI = llmProviders['google'];

    const model = new CustomChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        apiKey: 'fake1,fake2'
    });

    console.log("Starting stream...");
    try {
        const stream = await model.stream('hello');
        for await (const chunk of stream) {
            console.log(chunk);
        }
    } catch (e) {
        console.log("Caught Error Message:", e.message);
        console.log("Status:", e.status);

        const isQuotaEvent = e?.status === 429 || e?.message?.includes('429');
        const isGenericQuota = e?.status === 403 || e?.message?.includes('403');
        const isInvalidKey = e?.status === 400 || e?.message?.includes('API_KEY_INVALID');

        console.log("isInvalidKey?", isInvalidKey);
    }
}

main().catch(console.error);
