const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { getEnvironmentVariable } = require('@langchain/core/utils/env');

class n8nWebhook extends Tool {
    static lc_name() {
        return 'n8n';
    }

    constructor(fields = {}) {
        super(fields);
        this.name = 'n8n';
        this.envVarUrl = 'N8N_WEBHOOK_URL';
        this.override = fields.override ?? false;
        this.webhookUrl = fields[this.envVarUrl] ?? getEnvironmentVariable(this.envVarUrl);

        if (!this.override && !this.webhookUrl) {
            throw new Error(`Missing ${this.envVarUrl} environment variable or configuration.`);
        }

        this.description =
            'Triggers an n8n workflow via webhook. Use this tool to send data to n8n for processing, automation, or integration with other services. The input should be a JSON string representing the payload to send.';

        this.schema = z.object({
            payload: z
                .string()
                .describe('The JSON payload to send to the n8n webhook. Must be a valid JSON string.'),
        });
    }

    async _call(input) {
        const validationResult = this.schema.safeParse(input);
        if (!validationResult.success) {
            throw new Error(`Validation failed: ${JSON.stringify(validationResult.error.issues)}`);
        }

        const { payload } = validationResult.data;
        let parsedPayload;
        try {
            parsedPayload = JSON.parse(payload);
        } catch (e) {
            throw new Error('Invalid JSON payload provided.');
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedPayload),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`n8n webhook failed with status ${response.status}: ${responseText}`);
            }

            return responseText || 'Webhook triggered successfully.';
        } catch (error) {
            throw new Error(`Failed to trigger n8n webhook: ${error.message}`);
        }
    }
}

module.exports = n8nWebhook;
