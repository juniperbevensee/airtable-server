/**
 * Query Agent - Handles reading/searching Airtable records
 *
 * This is a CONCRETE implementation of BaseAgent
 * Notice how it implements all the abstract methods!
 */

import Airtable from 'airtable';
import { BaseAgent } from '../base-agent';
import { llmClient } from '../llm-client';
import { config } from '../config';
import { extractTableFromMessage, resolveTableName } from '../airtable-schema';

export class QueryAgent extends BaseAgent {
    private airtable: Airtable.Base;

    constructor(tableName?: string) {
        super();

        // Initialize Airtable connection
        // "as string" tells TypeScript: "Trust me, this will be a string"
        Airtable.configure({
            apiKey: config.airtable.apiKey as string,
        });

        this.airtable = Airtable.base(config.airtable.baseId as string);
        this.tableName = tableName || config.airtable.tableName;
    }

    private tableName: string;

    /**
     * Extract JSON from LLM response, handling extra text or special tokens
     */
    private extractJSON(text: string): any {
        // Try to find JSON object in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                // Validate that we got the expected structure
                if (typeof parsed === 'object' && parsed !== null) {
                    return {
                        fields: parsed.fields || [],
                        filterByFormula: parsed.filterByFormula || '',
                        maxRecords: parsed.maxRecords || 10,
                    };
                }
            } catch (e) {
                this.log(`Failed to parse extracted JSON: ${e}`);
                this.log(`Raw JSON attempt: ${jsonMatch[0].substring(0, 100)}...`);
            }
        }

        // If no JSON found, return defaults
        this.log('No valid JSON found, using defaults');
        return {
            fields: [],
            filterByFormula: '',
            maxRecords: 10,
        };
    }

    getName(): string {
        return 'QueryAgent';
    }

    getDescription(): string {
        return 'Searches and retrieves records from Airtable';
    }

    /**
     * Check if this message is asking to query/search/find records
     */
    async canHandle(message: string): Promise<boolean> {
        const lowerMessage = message.toLowerCase();

        // Simple keyword matching for queries and detail requests
        const queryKeywords = [
            'find',
            'search',
            'show',
            'get',
            'list',
            'what',
            'who',
            'which',
            'give',
            'tell me',
            'details',
            'more information',
            'info on',
            'about',
            'describe',
        ];

        const hasKeyword = queryKeywords.some((keyword) => lowerMessage.includes(keyword));

        if (hasKeyword) {
            this.log(`Can handle: "${message}"`);
            return true;
        }

        return false;
    }

    /**
     * Process the query request
     */
    async process(message: string): Promise<string> {
        try {
            this.log('Processing query request...');

            // Try to extract table name from the message
            const detectedTable = await extractTableFromMessage(message);
            const targetTable = detectedTable || this.tableName;

            // Resolve table ID to friendly name for logging
            const friendlyTableName = await resolveTableName(targetTable);

            if (detectedTable) {
                this.log(`Detected table from message: ${friendlyTableName}`);
            } else {
                this.log(`Using default table: ${friendlyTableName}`);
            }

            // Use LLM to extract what fields the user wants and any filters
            const extractionPrompt = `Extract query parameters from: "${message}"

Return ONLY this JSON (no other text):
{
  "fields": [],
  "filterByFormula": "",
  "maxRecords": 10
}

Notes:
- If asking for details about a specific item (e.g., "Human User Interface"), use filterByFormula to search for it
- Example: "details on X" -> {"filterByFormula": "SEARCH('X', {Name})", "maxRecords": 1}
- For "all records", leave filterByFormula empty

JSON:`;

            const llmResponse = await llmClient.complete(extractionPrompt);
            this.log(`Raw LLM response: ${llmResponse.substring(0, 200)}...`);

            const queryParams = this.extractJSON(llmResponse);

            this.log(`Query params: ${JSON.stringify(queryParams)}`);

            // Query Airtable
            const records: any[] = [];

            await this.airtable(targetTable)
                .select({
                    maxRecords: queryParams.maxRecords || 10,
                    filterByFormula: queryParams.filterByFormula || '',
                })
                .eachPage((pageRecords, fetchNextPage) => {
                    records.push(...pageRecords);
                    fetchNextPage();
                });

            if (records.length === 0) {
                return `No records found in the "${friendlyTableName}" table matching your criteria.`;
            }

            this.log(`Found ${records.length} records in "${friendlyTableName}"`);

            // Format results
            const formattedRecords = records.map((record) => {
                return {
                    id: record.id,
                    fields: record.fields,
                };
            });

            // Use LLM to create a natural language summary
            const summaryPrompt = `Summarize these Airtable records in a friendly, conversational way:
${JSON.stringify(formattedRecords, null, 2)}

User's original question: "${message}"`;

            const summary = await llmClient.complete(summaryPrompt);

            return summary;
        } catch (error) {
            this.log(`Error: ${error}`);
            return `Sorry, I encountered an error while querying: ${error}`;
        }
    }
}
