/**
 * Base Agent Class
 *
 * This is like Python's abstract base class (ABC)
 * In TypeScript, we use "abstract" keyword to define methods that child classes MUST implement
 *
 * Think of this as a template that all specific agents (query, create, update) will follow
 */

export abstract class BaseAgent {
    /**
     * Get the agent's name
     * Like: def get_name(self) -> str: ...
     */
    abstract getName(): string;

    /**
     * Get the agent's description
     * Helps identify what this agent does
     */
    abstract getDescription(): string;

    /**
     * Check if this agent can handle the user's message
     *
     * @param message - The user's message
     * @returns true if this agent should process the message
     *
     * Example: A "create record" agent checks if message contains "create" or "add"
     */
    abstract canHandle(message: string): Promise<boolean>;

    /**
     * Process the user's message and return a response
     *
     * @param message - The user's message
     * @returns The agent's response
     *
     * This is where the actual work happens!
     */
    abstract process(message: string): Promise<string>;

    /**
     * Helper method to log agent activity
     * Protected means: only this class and child classes can use it
     */
    protected log(message: string): void {
        console.log(`[${this.getName()}] ${message}`);
    }
}
