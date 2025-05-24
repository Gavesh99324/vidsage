import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { MemorySaver } from "@langchain/langgraph";
import { vectorStore, addYTVideoToVectorStore } from "./embeddings.js";
import dotenv from "dotenv";
import data from './data.js';

dotenv.config();

//Data
await addYTVideoToVectorStore(data[0]);
await addYTVideoToVectorStore(data[1]);

// Retrieval tool
const retrieveTool = tool(
    async ({ query }, { configurable: { video_id } }) => {
            const retrievedDocs = await vectorStore.similaritySearch(
                query, 
                3, 
                (doc) => doc.metadata.video_id === video_id
            );

        const serializedDocs = retrievedDocs
           .map((doc) => doc.pageContent)
           .join('\n');

        return serializedDocs;
    }, {
    name: 'retrieve',
    description: 'Retrieve tho most relevant chunks of text from the transcript of a youtube video',
    schema: z.object({
        query: z.string(),
    })
});

const llm = new ChatAnthropic({
    modelName: 'claude-3-7-sonnet-latest',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const checkpointer = new MemorySaver();

const agent = createReactAgent({ llm, tools: [retrieveTool], checkpointer });


// Testing the agent
const video_id = "Pxn276cWKeI";

console.log("Q1: What will people learn from this video?")
const results = await agent.invoke({
    messages: [
        { 
            role: 'user', 
            content: 'What will people learn from the video based on its transcript?' 
        }
    ]
  }, 
  { configurable: { thread_id: 1, video_id }}
);
console.log(results.messages.at(-1)?.content);
