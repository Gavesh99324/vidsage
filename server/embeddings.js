import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Documents } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
});

export const vectorStore = new MemoryVectorStore(embeddings);

export const addYTVideoToVectorStore = async (videoData) => {
    const { transcript, video_id } = videoData;

    const docs = [
        new Document({ 
            pageContent: videoData, 
            metadata: { video_id },
        }),
    ];

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(chunks);
} 