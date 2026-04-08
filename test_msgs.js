const { formatAgentMessages } = require('./api/app/clients/prompts/formatMessages.js');
const { ContentTypes } = require('librechat-data-provider');

const payload = [
  {
    role: 'user',
    content: [{ type: 'text', text: 'Hello' }]
  },
  {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Wait...', tool_call_ids: ['call_123'] },
      { type: 'tool_call', tool_call: { id: 'call_123', name: 'search', args: '{}', output: 'Results found.' } }
    ]
  },
  {
    role: 'user',
    content: [{ type: 'text', text: 'Continua' }]
  }
];

const messages = formatAgentMessages(payload);
console.log(messages.map(m => m.constructor.name + ': ' + JSON.stringify(m)));
