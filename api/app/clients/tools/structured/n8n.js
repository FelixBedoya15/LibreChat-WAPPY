const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { getEnvironmentVariable } = require('@langchain/core/utils/env');

class n8nWebhook extends Tool {
    static lc_name() {
        return 'n8n';
    }

    constructor(fields = {}) {
        super(fields);
        console.log('[n8n] Constructor initialized with fields:', Object.keys(fields));
        this.name = 'n8n';
        this.envVarUrl = 'N8N_WEBHOOK_URL';
        this.override = fields.override ?? false;
        this.webhookUrl = fields[this.envVarUrl] ?? getEnvironmentVariable(this.envVarUrl);

        if (!this.override && !this.webhookUrl) {
            throw new Error(`Missing ${this.envVarUrl} environment variable or configuration.`);
        }

        this.description =
            'ALWAYS use this tool when the user wants to send data to n8n, trigger a webhook, or connect to an external workflow. The "payload" argument is required and can be any text, JSON, or object you want to send.';

        this.schema = z.object({
            payload: z
                .string()
                .describe('The JSON string payload to send to the n8n webhook. You must serialize your data into a JSON string.'),
        });
    }

    async _call(input) {
        console.log('[n8n] Tool called with input:', input);
        const validationResult = this.schema.safeParse(input);
        if (!validationResult.success) {
            throw new Error(`Validation failed: ${JSON.stringify(validationResult.error.issues)}`);
        }

        const { payload } = validationResult.data;
        let parsedPayload = payload;

        if (typeof payload === 'string') {
            try {
                parsedPayload = JSON.parse(payload);
            } catch (e) {
                // If it's a simple string, wrap it in an object
                parsedPayload = { message: payload };
            }
        } else if (typeof payload !== 'object' || payload === null) {
            parsedPayload = { message: String(payload) };
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedPayload),
            });

            const contentType = response.headers.get('content-type');
            let result;

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
                result = JSON.stringify(result);
            } else {
                result = await response.text();
            }

            if (!response.ok) {
                throw new Error(`n8n webhook failed with status ${response.status}: ${result}`);
            }

            return result || 'Webhook triggered successfully.';
        } catch (error) {
            throw new Error(`Failed to trigger n8n webhook: ${error.message}`);
        }
    }
}

module.exports = n8nWebhook;
