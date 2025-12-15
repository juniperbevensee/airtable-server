/**
 * Configuration loaded from environment variables
 *
 * In Python you might do: os.getenv('PORT', '3000')
 * In TypeScript with dotenv: process.env.PORT || '3000'
 */

import dotenv from 'dotenv';

// Load .env file into process.env
dotenv.config();

export const config = {
    // Server settings
    port: parseInt(process.env.PORT || '3000', 10),

    // LM Studio settings
    lmStudio: {
        host: process.env.LM_STUDIO_HOST || 'localhost',
        port: parseInt(process.env.LM_STUDIO_PORT || '1234', 10),
        modelName: process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b',
    },

    // Airtable settings
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY || '',
        baseId: process.env.AIRTABLE_BASE_ID || '',
    },
};

// Validate required configuration
export function validateConfig(): void {
    if (!config.airtable.apiKey) {
        throw new Error('AIRTABLE_API_KEY is required in .env file');
    }
    if (!config.airtable.baseId) {
        throw new Error('AIRTABLE_BASE_ID is required in .env file');
    }
}
