import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import OpenAI from 'openai';
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { create } from 'domain';
import { match } from 'assert';
import express from 'express';

const pc = new Pinecone({
  apiKey: 'b56c7742-f821-429a-a6de-3303d9c7045b',
});

const openai = new OpenAI({
  apiKey: "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", 
  dangerouslyAllowBrowser: true
});




const index = pc.index('pilotpinecone');

export const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
    
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    acceptedFiles.forEach(file => {
      if (file.type === 'text/plain') {
        console.log('text file dropped');

        processTextFile(file);
      } else {
        console.log('Non-text file dropped');
      }
    });
  }, []);

  const processTextFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const textChunks = splitText(text, 4096);
      const embeddings = [];

      for (const chunk of textChunks) {
        const embedding = await createEmbeddings(chunk);
        embeddings.push(embedding);
        console.log(embedding);
      }

      const records = embeddings.map((values, index) => ({
        id: (index + 1).toString(),
        values,
        metadata: {
          text: textChunks[index], // Include the corresponding text chun
        }
      }));


      await index.upsert(records);
      console.log('upserted');

    };
    reader.readAsText(file);
  };



  const splitText = (text: string, chunkSize: number): string[] => {
    const textChunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      textChunks.push(text.substring(i, i + chunkSize));
    }
    return textChunks;
  };

  const renderFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt={file.name} style={{ maxWidth: '100px', maxHeight: '100px' }} />;
    } else {
      return <div>No preview available</div>;
    }
  };

    // Function to create a prompt with given context and query
  


 





  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed grey', padding: '20px', textAlign: 'center' }}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', marginTop: '20px' }}>
        {files.map((file, index) => (
          <div key={index} style={{ width: '120px', textAlign: 'center' }}>
            {renderFilePreview(file)}
            <span>{file.name}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <h2>Manage Flights</h2>
        <button onClick={() => getChatCompletionResponse('What is Ikea?').then(response => console.log(response))
}>Create Flight</button>
      </div>
    </div>
  );


};
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string; // Optional based on OpenAI's requirement
}

const chatCompletion = async (messages: ChatMessage[]) => {
  return openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
  });
};

const getPrompt = (context: string, query: string): string => {
  return `Answer the question as truthfully and accurately as possible using the provided context.
    If the answer is not contained within the text below, say "Sorry, I don't have that information.".

    Context: ${context}

    Question: ${query}

    Answer: `;
};

const createEmbeddings = async (text: string) => {
  const response = await openai.embeddings.create({
    input: 'The quick brown fox jumped over the lazy dog',
    model: 'text-embedding-3-small',
    dimensions: 1536,
    encoding_format: 'float',
    user: 'user-1234',
  });
  return response['data'][0]['embedding'];
};


const embedQuery = async (text: string) => {
  try {
    var embedding = await createEmbeddings(text);
    var val = await index.query({ topK: 5, includeMetadata: true, vector: embedding });
    // Logging the received value
    console.log("Query result:", val.matches);
    return val.matches.map(match => match.metadata);

  } catch (error) {
    console.error("Error during embedding or querying:", error);
  }

};

export const testFun = () => {
  console.log( "Test Passed");
  
}


export const getChatCompletionResponse = async (query: string) => {
  try {
    // Get metadata (or context) for the prompt
    const metadata = await embedQuery(query);  // Replace with actual metadata retrieval logic
    const metaValue = JSON.stringify(metadata, null, 2);

    console.log("Metadata: " + metaValue);

    const prompt = getPrompt(metaValue, query);

    console.log("Prompt: " + prompt)
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await chatCompletion(messages);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


export default App;
// Create an instance of Express
