// Test script to show the full agentic research pipeline
// This demonstrates how a query is transformed by Claude and then processed by Perplexity,
// followed by how Claude structures the final output

import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Access Perplexity API key
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

if (!process.env.ANTHROPIC_API_KEY || !process.env.PERPLEXITY_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY and PERPLEXITY_API_KEY must be set in environment variables');
  process.exit(1);
}

// The test query from user
const userQuery = "research organoids in cancer modeling";

// Log results to file for inspection
const logFilePath = path.join(__dirname, '../research-pipeline-log.json');
const results = {
  inputQuery: userQuery,
  stages: []
};

async function saveResults() {
  fs.writeFileSync(logFilePath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${logFilePath}`);
}

// STEP 1: Use Claude to optimize the query
async function createOptimizedQuery(query) {
  console.log('\n==== STEP 1: CLAUDE QUERY OPTIMIZATION ====');
  console.log(`Original query: "${query}"`);
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 500,
      temperature: 0.1,
      system: `You are an expert research assistant that helps formulate precise, detailed search queries.
      Your task is to analyze the user's research topic or text and transform it into an optimized search query.
      Create a query that will yield comprehensive academic results when sent to a search system.
      Focus on extracting key concepts, using proper terminology, and including any relevant qualifiers.
      The query should be a single paragraph that thoroughly describes what information is being sought.
      Do not include any explanations or formatting - just output the optimized query text.`,
      messages: [
        { role: "user", content: `Please create an optimized research query from this topic or text: "${query}"` }
      ],
    });
    
    // Extract the optimized query
    let optimizedQuery = "";
    if (response.content[0].type === 'text') {
      optimizedQuery = response.content[0].text;
    } else {
      optimizedQuery = String(response.content[0]);
    }
    
    console.log('\nOptimized query:');
    console.log(optimizedQuery);
    
    // Save to results
    results.stages.push({
      stage: "Query Optimization",
      input: query,
      output: optimizedQuery
    });
    
    return optimizedQuery;
  } catch (error) {
    console.error('Error in Claude query optimization:', error);
    throw error;
  }
}

// STEP 2: Send to Perplexity for deep research
async function performPerplexityResearch(optimizedQuery) {
  console.log('\n==== STEP 2: PERPLEXITY DEEP RESEARCH ====');
  console.log('Sending optimized query to Perplexity...');
  
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a research assistant providing detailed information. Include citations to all sources."
          },
          {
            role: "user",
            content: optimizedQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        stream: false,
        search_domain_filter: ["ncbi.nlm.nih.gov", "scholar.google.com", "sciencedirect.com"],
        return_images: false
      },
      {
        headers: {
          "Authorization": `Bearer ${perplexityApiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 600000 // 10 minute timeout
      }
    );
    
    const perplexityResponse = response.data;
    
    // Extract content and citations
    const content = perplexityResponse.choices[0]?.message?.content || "";
    const citations = perplexityResponse.citations || [];
    
    console.log('\nPerplexity Research Content (first 500 chars):');
    console.log(content.substring(0, 500) + '...');
    
    console.log('\nCitations:');
    citations.forEach((citation, index) => {
      console.log(`[${index + 1}] ${citation}`);
    });
    
    // Save to results
    results.stages.push({
      stage: "Perplexity Research",
      input: optimizedQuery,
      output: {
        content: content,
        citations: citations
      }
    });
    
    return { content, citations };
  } catch (error) {
    console.error('Error in Perplexity research:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// STEP 3: Use Claude to structure the research into a formal output
async function structureOutput(originalQuery, perplexityContent, perplexityCitations) {
  console.log('\n==== STEP 3: CLAUDE CONTENT STRUCTURING ====');
  console.log('Asking Claude to structure the research content...');
  
  try {
    // Prepare citation information for Claude
    const citationsText = perplexityCitations.map((citation, index) => 
      `[${index + 1}] ${citation}`
    ).join('\n');
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 3500,
      temperature: 0.2,
      system: `You are an expert academic editor that structures research content into proper academic format.
      Your task is to take raw research content and organize it into a well-structured paper introduction with:
      1. A clear, informative title related to the research topic
      2. Well-organized paragraphs with logical flow
      3. Proper integration of citations using the format [n] where n is the citation number
      4. Academic tone and language
      
      Structure the output as a cohesive paper introduction that explains the topic thoroughly.
      Use the citations provided by properly referencing them as [1], [2], etc. at appropriate places.
      Do not add any citations that are not in the provided list.
      Format the content cleanly with proper paragraphs and spacing.`,
      messages: [
        { 
          role: "user", 
          content: `Please structure the following research content into a proper academic paper introduction.
          
Original topic: "${originalQuery}"

CONTENT FROM RESEARCH:
${perplexityContent}

AVAILABLE CITATIONS:
${citationsText}

Please format this as a professional academic paper introduction with proper citation integration.` 
        }
      ],
    });
    
    // Parse Claude's response to extract title and content
    let fullText = "";
    if (response.content[0].type === 'text') {
      fullText = response.content[0].text.trim();
    } else {
      fullText = String(response.content[0]).trim();
    }
    
    const titleMatch = fullText.match(/^#\s+(.+?)(?:\n|$)/m);
    const title = titleMatch ? titleMatch[1].trim() : "Research on " + originalQuery;
    
    // Remove the title from the content if it exists
    let content = titleMatch ? fullText.replace(titleMatch[0], '').trim() : fullText;
    
    console.log('\nStructured Output:');
    console.log(`Title: ${title}`);
    console.log('\nContent (first 500 chars):');
    console.log(content.substring(0, 500) + '...');
    
    // Save to results
    results.stages.push({
      stage: "Claude Structuring",
      input: {
        originalQuery,
        perplexityContent: perplexityContent.substring(0, 500) + '...',
        citationsCount: perplexityCitations.length
      },
      output: {
        title,
        content: content.substring(0, 1000) + '...'
      }
    });
    
    return { title, content };
  } catch (error) {
    console.error('Error in Claude structuring:', error);
    throw error;
  }
}

// Main test function
async function runTest() {
  console.log('==============================================');
  console.log('TESTING FULL AGENTIC RESEARCH PIPELINE');
  console.log('==============================================');
  console.log(`Input query: "${userQuery}"`);
  
  try {
    // Step 1: Optimize query with Claude
    const optimizedQuery = await createOptimizedQuery(userQuery);
    
    // Step 2: Get research data from Perplexity
    const { content, citations } = await performPerplexityResearch(optimizedQuery);
    
    // Step 3: Structure the output with Claude
    const structuredOutput = await structureOutput(userQuery, content, citations);
    
    console.log('\n==============================================');
    console.log('PIPELINE TEST COMPLETED SUCCESSFULLY');
    console.log('==============================================');
    
    // Save all results to file
    results.finalOutput = {
      title: structuredOutput.title,
      citationsCount: citations.length,
      completedAt: new Date().toISOString()
    };
    await saveResults();
    
    // Print success message with details
    console.log('\nSuccessfully completed research pipeline:');
    console.log(`- Title: ${structuredOutput.title}`);
    console.log(`- Citations: ${citations.length}`);
    console.log(`- Content length: ${structuredOutput.content.length} characters`);
    
  } catch (error) {
    console.error('\nError in pipeline test:');
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      results.error = `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      console.error('Request error (no response):', error.request);
      results.error = `Request Error: No response received - ${error.message}`;
    } else {
      console.error('Error details:', error);
      results.error = String(error);
    }
    
    results.completedAt = new Date().toISOString();
    await saveResults();
  }
}

// Run the test
runTest();