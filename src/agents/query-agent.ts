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
import { extractTableFromMessage } from '../airtable-schema';

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
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                this.log(`Failed to parse extracted JSON: ${e}`);
            }
        }

        // If no JSON found, return defaults
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

        // Simple keyword matching
        const queryKeywords = ['find', 'search', 'show', 'get', 'list', 'what', 'who', 'which'];

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

            if (detectedTable) {
                this.log(`Detected table from message: ${detectedTable}`);
            } else {
                this.log(`Using default table: ${this.tableName}`);
            }

            // Use LLM to extract what fields the user wants and any filters
            const extractionPrompt = `Extract query parameters from: "${message}"

Return ONLY this JSON (no other text):
{
  "fields": [],
  "filterByFormula": "",
  "maxRecords": 10
}

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
                return `No records found in the "${targetTable}" table matching your criteria.`;
            }

            this.log(`Found ${records.length} records in "${targetTable}"`);

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
