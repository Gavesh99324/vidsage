import express from 'express';
import cors from 'cors';
import {agent} from './agent.js';

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());
 
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/generate', (req, res) => {
    const { query, video_id, thread_id } = req.body;
    console.log(query, video_id, thread_id);

    const results = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: query
        },
    ],
  },
  { configurable: { thread_id, video_id } }
);
console.log(results.messages.at(-1)?.content);

    res.send(results.messages.at(-1)?.content);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
