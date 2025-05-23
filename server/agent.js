import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import dotenv from "dotenv";

dotenv.config();

import data from './data.js';

//Data
const video1 = data[0];
const docs = [new Document({ pageContent: video1.transcript, metadata: {video_id: video1.video_id}})]

//Split the video into chunks
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});


//Embed the chunks
const chunks = await splitter.splitDocuments(docs);

const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
});

const vectorStore = new MemoryVectorStore(embeddings);

await vectorStore.addDocuments(chunks);

//Retrieve the most relevant chunks
const retrievedDocs = await vectorStore.similaritySearch('What was the finish time of the Norris?', 1);
console.log('Retrieved docs: ------------------');
console.log(retrievedDocs);

// Retrieval tool
const retrieveTool = tool(
    async ({ query }) => {
        console.log('Retrieving docs for query:----------------');
        console.log(query);

        return 'Norris was first finishing in 33 seconds';
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

const agent = createReactAgent({ llm, tools: [retrieveTool] });

const results = await agent.invoke({
    messages: [{ role: 'user', content: 'What was the finish time of Norris?' }]
});

console.log(results.messages.at(-1)?.content);
 
