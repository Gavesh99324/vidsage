import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";
import { vectorStore, addYTVideoToVectorStore } from "./embeddings.js";
import dotenv from "dotenv";
import data from "./data.js";

dotenv.config();

// Debug logging
console.log("Environment variables loaded:");
console.log("ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
console.log("DB_URL exists:", !!process.env.DB_URL);
console.log("HF_API_KEY exists:", !!process.env.HF_API_KEY);

//Data
await addYTVideoToVectorStore(data[0]);
await addYTVideoToVectorStore(data[1]);

// Retrieval tool
const retrieveTool = tool(
  async ({ query }, { configurable: { video_id } }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 3, {
      video_id,
    });

    const serializedDocs = retrievedDocs
      .map((doc) => doc.pageContent)
      .join("\n");

    return serializedDocs;
  },
  {
    name: "retrieve",
    description:
      "Retrieve tho most relevant chunks of text from the transcript of a youtube video",
    schema: z.object({
      query: z.string(),
    }),
  }
);

const llm = new ChatAnthropic({
  modelName: "claude-3-7-sonnet-latest",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const checkpointer = new MemorySaver();

export const agent = createReactAgent({
  llm,
  tools: [retrieveTool],
  checkpointer,
});


