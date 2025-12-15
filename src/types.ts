/**
 * Types for our Airtable Agent Server
 *
 * This is like defining the "shape" of our data in Python type hints,
 * but TypeScript enforces these at compile time!
 */

// The message format from the user
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// The request coming into our server (OpenAI format)
export interface ChatRequest {
    messages: ChatMessage[];
}

// Ollama request format (alternative)
export interface OllamaRequest {
    model?: string;
    messages: ChatMessage[];
    stream?: boolean;
    options?: {
        temperature?: number;
        num_predict?: number;
    };
}

// The response we send back
export interface ChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: string;
    }>;
}

// Ollama response format
export interface OllamaResponse {
    model: string;
    created_at: string;
    message: ChatMessage;
    done: boolean;
}

// Airtable record structure (you can customize based on your base)
export interface AirtableRecord {
    id?: string;
    fields: Record<string, any>; // Record<string, any> means: keys are strings, values can be anything
}

// Query parameters for searching Airtable
export interface AirtableQuery {
    filterByFormula?: string;
    maxRecords?: number;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}
