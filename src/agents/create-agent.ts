/**
 * Create Agent - Handles creating new Airtable records
 */

import Airtable from 'airtable';
import { BaseAgent } from '../base-agent';
import { llmClient } from '../llm-client';
import { config } from '../config';
import { extractTableFromMessage } from '../airtable-schema';

export class CreateAgent extends BaseAgent {
    private airtable: Airtable.Base;
    private tableName: string;

    constructor(tableName?: string) {
        super();

        Airtable.configure({
            apiKey: config.airtable.apiKey as string,
        });

        this.airtable = Airtable.base(config.airtable.baseId as string);
        this.tableName = tableName || config.airtable.tableName;
    }

    getName(): string {
        return 'CreateAgent';
    }

    getDescription(): string {
        return 'Creates new records in Airtable';
    }

    async canHandle(message: string): Promise<boolean> {
        const lowerMessage = message.toLowerCase();

        const createKeywords = ['create', 'add', 'new', 'insert', 'make'];

        const hasKeyword = createKeywords.some((keyword) => lowerMessage.includes(keyword));

        if (hasKeyword) {
            this.log(`Can handle: "${message}"`);
            return true;
        }

        return false;
    }

    async process(message: string): Promise<string> {
        try {
            this.log('Processing create request...');

            // Try to extract table name from the message
            const detectedTable = await extractTableFromMessage(message);
            const targetTable = detectedTable || this.tableName;

            if (detectedTable) {
                this.log(`Detected table from message: ${detectedTable}`);
            } else {
                this.log(`Using default table: ${this.tableName}`);
            }

            // Use LLM to extract the fields and values to create
            const extractionPrompt = `Given this user request: "${message}"

Extract the field names and values to create a new Airtable record.
Respond with ONLY a JSON object in this format:
{
  "fields": {
    "FieldName1": "value1",
    "FieldName2": "value2"
  }
}

Example: "Create a contact named John Smith with email john@example.com"
Response: {"fields": {"Name": "John Smith", "Email": "john@example.com"}}`;

            const llmResponse = await llmClient.complete(extractionPrompt);
            const recordData = JSON.parse(llmResponse);

            this.log(`Creating record in "${targetTable}" with fields: ${JSON.stringify(recordData.fields)}`);

            // Create the record in Airtable
            const createdRecord = await this.airtable(targetTable).create([
                {
                    fields: recordData.fields,
                },
            ]);

            const record = createdRecord[0];

            if (!record) {
                throw new Error('Failed to create record');
            }

            return `✅ Successfully created record in "${targetTable}"!\n\nID: ${record.id}\nFields: ${JSON.stringify(record.fields, null, 2)}`;
        } catch (error) {
            this.log(`Error: ${error}`);
            return `Sorry, I encountered an error while creating the record: ${error}`;
        }
    }
}
