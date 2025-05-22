import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain/langraph/prebuilt";

const llm = new ChatAnthropic({
    modelName: 'claude-3-7-sonnet-latest',
})

const agent = createAgent({ llm, tool: []})

 