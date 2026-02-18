require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini3Thought() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('Please set GOOGLE_API_KEY in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        tools: [
            {
                functionDeclarations: [
                    {
                        name: 'get_current_weather',
                        description: 'Get the current weather in a given location',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                location: {
                                    type: 'STRING',
                                    description: 'The city and state, e.g. San Francisco, CA',
                                },
                                unit: {
                                    type: 'STRING',
                                    enum: ['celsius', 'fahrenheit'],
                                },
                            },
                            required: ['location'],
                        },
                    },
                ],
            },
        ],
    });

    const chat = model.startChat();

    console.log('User: What is the weather in San Francisco?');
    const result1 = await chat.sendMessage('What is the weather in San Francisco?');
    const response1 = result1.response;
    console.log('Model Response 1:', JSON.stringify(response1, null, 2));

    const call = response1.functionCalls()[0];
    if (call) {
        console.log('Function Call:', call);

        // Simulate function execution
        const weather = { location: 'San Francisco', temperature: '72', unit: 'fahrenheit' };

        const parts = [
            {
                functionResponse: {
                    name: 'get_current_weather',
                    response: {
                        name: 'get_current_weather',
                        content: weather,
                    },
                },
            },
        ];

        console.log('Sending function response...');
        try {
            const result2 = await chat.sendMessage(parts);
            console.log('Model Response 2:', result2.response.text());
        } catch (e) {
            console.error('Error sending function response:', e);
        }
    }
}

testGemini3Thought();
