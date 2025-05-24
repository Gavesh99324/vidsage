import { OpenAIEmbeddings } from "@langchain/openai";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

import 'dotenv/config';

const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2", // free model
    apiKey: process.env.HF_API_KEY, 
});

/*
const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
});
*/


export const vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: {
        connectionString: process.env.DB_URL,
    },
    tableName: 'transcripts',
    columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
    },
    distanceStrategy: 'cosine',
    createTableIfNotExists: true,
});

export const addYTVideoToVectorStore = async (videoData) => {
    const { transcript, video_id } = videoData;
 
    const docs = [
        new Document({ 
            pageContent: transcript, 
            metadata: { video_id },
        }),
    ];

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(chunks);
};