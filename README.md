# Airtable Agent Server 🤖

A TypeScript server that handles Airtable requests using natural language, powered by local LLMs via LM Studio.

## 🎯 What Does This Do?

This server lets you interact with Airtable using plain English! Just send a message like:
- "Find all contacts with gmail addresses"
- "Create a new task called 'Learn TypeScript'"
- "Show me the 5 most recent entries"

The server uses a local LLM (via LM Studio) to understand your request and automatically calls the right Airtable operations.

## 📚 Architecture

This follows a modular **agent pattern**:

```
User Request → Server → Agent Selection → LLM Parsing → Airtable API → Response
```

- **Express Server**: Handles HTTP requests (like Flask in Python)
- **Base Agent**: Abstract class defining the agent interface
- **Concrete Agents**: QueryAgent, CreateAgent, etc.
- **LLM Client**: Communicates with LM Studio to parse requests
- **Type Safety**: TypeScript ensures type correctness at compile time

## 🚀 Setup

### Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **LM Studio** - [Download here](https://lmstudio.ai/)
   - Install and start LM Studio
   - Load a model (any instruct model works)
3. **Airtable Account** - [Sign up here](https://airtable.com/)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
'cp .env.example .env'
   - Edit `.env` file with your credentials:
```bash
# Get Airtable API key: https://airtable.com/create/tokens
AIRTABLE_API_KEY=your_key_here

# Get Base ID from your Airtable URL
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

3. Build the TypeScript code:
```bash
npm run build
```

## 🏃 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📡 API Usage

### Health Check
```bash
curl http://localhost:3000/health
```

### Send a Request
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Find all records in the table"}
    ]
  }'
```

### Set up daemon
two different endpoints depending on structure of request:
  POST /v1/chat/completions (OpenAI format)
  POST /api/chat (Ollama format)

## 🛠️ Project Structure

```
src/
├── server.ts              # Main Express server
├── config.ts              # Configuration & env variables
├── types.ts               # TypeScript type definitions
├── base-agent.ts          # Abstract base class for agents
├── llm-client.ts          # LM Studio client
└── agents/
    ├── query-agent.ts     # Handles search/query operations
    └── create-agent.ts    # Handles record creation
```

## ➕ Adding New Agents

1. Create a new file in `src/agents/`
2. Extend `BaseAgent` class
3. Implement required methods:
   - `getName()`: Agent identifier
   - `getDescription()`: What it does
   - `canHandle()`: Check if message matches
   - `process()`: Handle the request
4. Register in `server.ts`:
```typescript
const agents: BaseAgent[] = [
    new QueryAgent(),
    new CreateAgent(),
    new YourNewAgent(), // Add here!
];
```

## 🔑 Key TypeScript Concepts Used

- **Static Typing**: Variables have fixed types (caught at compile time)
- **Interfaces**: Define the shape of objects
- **Abstract Classes**: Templates for other classes to implement
- **Async/Await**: Handle asynchronous operations (like Python)
- **Generics**: Type-safe reusable code

## 🤔 Common Issues

### "Failed to connect to LM Studio"
- Make sure LM Studio is running
- Check that a model is loaded
- Verify the port in `.env` matches LM Studio (default: 1234)

### "AIRTABLE_API_KEY is required"
- Make sure you've edited `.env` with your actual credentials
- Don't use quotes around the values in `.env`

## 📖 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Airtable API Docs](https://airtable.com/developers/web/api/introduction)
- [LM Studio TypeScript SDK](https://lmstudio.ai/docs/typescript) 
