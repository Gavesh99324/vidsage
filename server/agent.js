import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/vectorstores/memory";


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
    modelName: 'text-embedding-3-large'
});

const vectorStore = new MemoryVectorStore(embeddings);



const llm = new ChatAnthropic({
    modelName: 'claude-3-7-sonnet-latest',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const agent = createReactAgent({ llm, tools: [] });

const results = await agent.invoke({
    messages: [{ role: 'user', content: 'What is the capital of the moon?' }]
})

console.log(results.messages.at(-1)?.content);
 
