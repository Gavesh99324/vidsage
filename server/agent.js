import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";


import data from './data.js';


const video1 = data[0];

const docs = [new Document({ pageContent: video1.transcript, metadata: {video_id: video1.video_id}})]

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);

console.log(chunks);


const llm = new ChatAnthropic({
    modelName: 'claude-3-7-sonnet-latest',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const agent = createReactAgent({ llm, tools: [] });

const results = await agent.invoke({
    messages: [{ role: 'user', content: 'What is the capital of the moon?' }]
})

console.log(results.messages.at(-1)?.content);
 
