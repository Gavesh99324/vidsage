import { OpenAIEmbeddings } from "@langchain/openai";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import dotenv from "dotenv";
import pg from 'pg';

dotenv.config();

// Log environment variables (without sensitive data)
console.log("✅ ENV loaded:", process.env.DB_URL?.startsWith("postgresql://") ? "Yes" : "No");
console.log("🧠 Anthropic Key Present:", !!process.env.ANTHROPIC_API_KEY);
console.log("🔑 HF Key Present:", !!process.env.HF_API_KEY);

// Test database connection first
console.log('Testing database connection...');
const client = new pg.Client({
    connectionString: process.env.DB_URL,
    connectionTimeoutMillis: 90000
});

try {
    console.log('Attempting to connect to PostgreSQL...');
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query the database
    console.log('Testing database query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database query successful:', result.rows[0]);
    
    await client.end();
} catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code) {
        console.error('Error code:', error.code);
    }
    if (error.detail) {
        console.error('Error detail:', error.detail);
    }
    throw error;
}

console.log("Initializing HuggingFace embeddings...");
const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2", // free model
    apiKey: process.env.HF_API_KEY, 
});
console.log("✅ HuggingFace embeddings initialized");

/*
const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
});
*/

export const vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: {
        connectionString: process.env.DB_URL,
        connectionTimeoutMillis: 90000,
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
    try {
        console.log('Adding video to vector store:', videoData.video_id);
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

        console.log('Splitting document into chunks...');
        const chunks = await splitter.splitDocuments(docs);
        console.log(`Created ${chunks.length} chunks`);

        console.log('Adding chunks to vector store...');
        await vectorStore.addDocuments(chunks);
        console.log('✅ Successfully added video to vector store');
    } catch (error) {
        console.error('❌ Error adding video to vector store:', error.message);
        console.error('Full error:', error);
        throw error;
    }
};