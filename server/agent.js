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
const video1 = data[0];
await addYTVideoToVectorStore(video1);

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

const video_id = "imMbPxcL8NY";

console.log("Q1: What was the finish position and time of Norris?")
const results = await agent.invoke({
    messages: [
        { 
            role: 'user', 
            content: 'What was the finish time of Norris? (based on video transcript)' 
        }
    ]
  }, 
  { configurable: { thread_id: 1, video_id }}
);
console.log(results.messages.at(-1)?.content);
