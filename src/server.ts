/**
 * Main Express Server
 *
 * This is like your Flask app in Python!
 * Express is the Node.js equivalent of Flask
 */

import express, { Request, Response } from 'express';
import { config, validateConfig } from './config';
import { llmClient } from './llm-client';
import { BaseAgent } from './base-agent';
import { QueryAgent } from './agents/query-agent';
import { CreateAgent } from './agents/create-agent';
import { ChatRequest, ChatResponse } from './types';

// Create Express app
const app = express();

// Middleware - tells Express to parse JSON request bodies
// Like Flask's request.get_json()
app.use(express.json());

// Array of all available agents
const agents: BaseAgent[] = [
    new QueryAgent(),
    new CreateAgent(),
    // Add more agents here as you create them!
];

/**
 * Health check endpoint
 * Good practice to have this for monitoring
 */
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Main chat completions endpoint
 * Matches OpenAI's API format (like your Python server)
 */
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
    try {
        const chatRequest = req.body as ChatRequest;

        // Get the user's message
        const userMessage = chatRequest.messages.find((msg) => msg.role === 'user');

        if (!userMessage) {
            res.status(400).json({ error: 'No user message found in request' });
            return;
        }

        console.log(`\n📨 Received message: "${userMessage.content}"\n`);

        // Try to find an agent that can handle this message
        let handlingAgent: BaseAgent | null = null;

        for (const agent of agents) {
            if (await agent.canHandle(userMessage.content)) {
                handlingAgent = agent;
                break;
            }
        }

        if (!handlingAgent) {
            res.status(400).json({
                error: 'No agent could handle this request',
                message: userMessage.content,
            });
            return;
        }

        console.log(`🤖 Routing to: ${handlingAgent.getName()}\n`);

        // Process the message with the selected agent
        const responseContent = await handlingAgent.process(userMessage.content);

        // Format response in OpenAI-compatible format
        const response: ChatResponse = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'airtable-agent',
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: responseContent,
                    },
                    finish_reason: 'stop',
                },
            ],
        };

        console.log(`✅ Response sent\n`);
        res.json(response);
    } catch (error) {
        console.error('❌ Error processing request:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Start the server
 */
async function startServer() {
    try {
        // Validate configuration
        console.log('🔧 Validating configuration...');
        validateConfig();

        // Connect to LM Studio
        console.log('🔌 Connecting to LM Studio...');
        await llmClient.connect();

        // Start listening
        app.listen(config.port, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 Airtable Agent Server is running!');
            console.log('='.repeat(50));
            console.log(`📍 Server: http://localhost:${config.port}`);
            console.log(`🧠 LM Studio: ${config.lmStudio.host}:${config.lmStudio.port}`);
            console.log(`📊 Airtable Base: ${config.airtable.baseId}`);
            console.log('='.repeat(50) + '\n');
            console.log('Available endpoints:');
            console.log('  GET  /health');
            console.log('  POST /v1/chat/completions');
            console.log('\nRegistered agents:');
            agents.forEach((agent) => {
                console.log(`  - ${agent.getName()}: ${agent.getDescription()}`);
            });
            console.log('\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
// In Python this would be: if __name__ == "__main__":
startServer();
