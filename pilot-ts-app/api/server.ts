import express, { Request, Response } from 'express';
import { testFun, getChatCompletionResponse } from '../src/App'; // Adjust the import path as needed

const app = express();
const port = 3000;


  // "scripts": {
  //   "dev": "nodemon source/server.ts",
  //   "build": "rm -rf build/ && prettier --write source/ && tsc"
  // }

  
app.use(express.json());

app.get('/test', (req: Request, res: Response) => {
  try {
    testFun();
    res.status(200).send('Test Passed');
  } catch (error) {
    res.status(500).send('Error occurred');
  }
});

app.post('/chat-completion', async (req: Request, res: Response) => {
  try {
    const query = req.body.query;
    if (!query) {
      return res.status(400).send('Query is required');
    }
    const response = await getChatCompletionResponse(query);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send('Error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
