/**
 * LLM Client - Communicates with LM Studio
 *
 * This uses the official LM Studio TypeScript SDK
 * Much cleaner than making raw HTTP requests!
 */

import { LMStudioClient } from '@lmstudio/sdk';
import { config } from './config';

class LLMClient {
    private client: LMStudioClient | null = null;
    private isConnected: boolean = false;

    /**
     * Connect to LM Studio
     * In Python this might be in __init__, but in TypeScript
     * we often separate connection logic for better error handling
     */
    async connect(): Promise<void> {
        try {
            this.client = new LMStudioClient({
                baseUrl: `ws://${config.lmStudio.host}:${config.lmStudio.port}`,
            });

            this.isConnected = true;
            console.log(`✅ Connected to LM Studio at ${config.lmStudio.host}:${config.lmStudio.port}`);
        } catch (error) {
            console.error('❌ Failed to connect to LM Studio:', error);
            throw error;
        }
    }

    /**
     * Send a prompt to the LLM and get a response
     *
     * @param prompt - The prompt to send
     * @param systemPrompt - Optional system prompt for context
     * @returns The LLM's response
     */
    async complete(prompt: string, systemPrompt?: string): Promise<string> {
        if (!this.client || !this.isConnected) {
            throw new Error('LLM client is not connected. Call connect() first.');
        }

        try {
            // Get the currently loaded model
            const model = await this.client.llm.load('local');

            // Build messages array
            const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }

            messages.push({ role: 'user', content: prompt });

            // Send the completion request
            const prediction = model.respond(messages, {
                temperature: 0.7,
                maxTokens: 1000,
            });

            // Collect the streamed response
            let response = '';
            for await (const chunk of prediction) {
                response += chunk.content;
            }

            return response.trim();
        } catch (error) {
            console.error('Error completing LLM request:', error);
            throw error;
        }
    }

    /**
     * Parse user intent from natural language
     * This helps determine which agent should handle the request
     *
     * @param message - The user's message
     * @returns Parsed intent and parameters
     */
    async parseIntent(message: string): Promise<{
        action: 'query' | 'create' | 'update' | 'delete' | 'unknown';
        confidence: number;
    }> {
        const systemPrompt = `You are a classifier that determines the user's intent for Airtable operations.
Respond with ONLY a JSON object in this format:
{"action": "query|create|update|delete", "confidence": 0.0-1.0}

Examples:
- "Find all contacts" -> {"action": "query", "confidence": 0.95}
- "Create a new task" -> {"action": "create", "confidence": 0.9}
- "Update John's email" -> {"action": "update", "confidence": 0.85}
- "Delete the old record" -> {"action": "delete", "confidence": 0.9}`;

        try {
            const response = await this.complete(message, systemPrompt);

            // Parse the JSON response
            const parsed = JSON.parse(response);
            return parsed;
        } catch (error) {
            console.error('Failed to parse intent:', error);
            return { action: 'unknown', confidence: 0 };
        }
    }
}

// Export a singleton instance
export const llmClient = new LLMClient();
