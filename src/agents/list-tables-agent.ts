/**
 * List Tables Agent - Shows available tables in the Airtable base
 */

import { BaseAgent } from '../base-agent';
import { fetchBaseTables } from '../airtable-schema';

export class ListTablesAgent extends BaseAgent {
    getName(): string {
        return 'ListTablesAgent';
    }

    getDescription(): string {
        return 'Lists all available tables in the Airtable base';
    }

    async canHandle(message: string): Promise<boolean> {
        const lowerMessage = message.toLowerCase();

        const keywords = [
            'what tables',
            'list tables',
            'show tables',
            'available tables',
            'which tables',
            'tables do you have',
            'what are the tables',
        ];

        const hasKeyword = keywords.some((keyword) => lowerMessage.includes(keyword));

        if (hasKeyword) {
            this.log(`Can handle: "${message}"`);
            return true;
        }

        return false;
    }

    async process(_message: string): Promise<string> {
        try {
            this.log('Fetching available tables...');

            const tables = await fetchBaseTables();

            if (tables.length === 0) {
                return 'I couldn\'t fetch the tables from your Airtable base. Please check your API credentials.';
            }

            let response = `I found ${tables.length} table${tables.length === 1 ? '' : 's'} in your Airtable base:\n\n`;

            tables.forEach((table, index) => {
                response += `${index + 1}. **${table.name}** (ID: ${table.id})\n`;
            });

            response += '\nYou can query any of these tables by mentioning the table name in your request, like "find all records in the Tasks table".';

            return response;
        } catch (error) {
            this.log(`Error: ${error}`);
            return `Sorry, I encountered an error while fetching tables: ${error}`;
        }
    }
}
