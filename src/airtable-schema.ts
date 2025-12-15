/**
 * Airtable Schema Utilities
 *
 * Fetches schema information from Airtable base
 */

import { config } from './config';

export interface TableInfo {
    id: string;
    name: string;
}

/**
 * Fetch all tables from the Airtable base
 */
export async function fetchBaseTables(): Promise<TableInfo[]> {
    try {
        // Use Airtable Meta API to fetch schema
        const response = await fetch(
            `https://api.airtable.com/v0/meta/bases/${config.airtable.baseId}/tables`,
            {
                headers: {
                    Authorization: `Bearer ${config.airtable.apiKey}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch schema: ${response.statusText}`);
        }

        const data = (await response.json()) as { tables: Array<{ id: string; name: string }> };

        return data.tables.map((table) => ({
            id: table.id,
            name: table.name,
        }));
    } catch (error) {
        console.error('Error fetching base schema:', error);
        return [];
    }
}

/**
 * Get table name by ID or return the name if it's already a name
 */
export async function resolveTableName(tableNameOrId: string): Promise<string> {
    // If it starts with 'tbl', it's likely an ID
    if (tableNameOrId.startsWith('tbl')) {
        const tables = await fetchBaseTables();
        const table = tables.find((t) => t.id === tableNameOrId);
        return table ? table.name : tableNameOrId;
    }

    return tableNameOrId;
}
