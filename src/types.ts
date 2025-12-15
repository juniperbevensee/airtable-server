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

// The request coming into our server
export interface ChatRequest {
    messages: ChatMessage[];
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
