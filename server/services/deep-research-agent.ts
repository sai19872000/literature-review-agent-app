/**
 * Deep Research Agent Service
 *
 * This service creates an agentic flow between Claude and Perplexity:
 * 1. Uses Claude to formulate optimized research queries from user input
 * 2. Makes a single call to Perplexity for deep research
 * 3. Uses Claude to structure the results with proper academic formatting and citations
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  generateResearchSummary,
  makePerplexitySonarQuery,
} from "./perplexity";
import { ResearchSummary, Citation } from "@shared/schema";

// Initialize Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Main function to process a deep research request using the agentic flow
 *
 * @param topic User's research topic or text
 * @returns A properly formatted research summary with citations
 */
export async function processDeepResearch(
  topic: string,
): Promise<ResearchSummary> {
  try {
    console.log(`Starting agentic deep research on topic: "${topic}"`);

    // Broadcast starting message
    broadcastProgress({
      stage: "starting",
      message: `Starting deep research on: "${topic}"`,
      progress: 0,
    });

    // STEP 1: Use Claude to create an optimized query for Perplexity
    broadcastProgress({
      stage: "query_generation",
      message: "Generating optimized research query with Claude...",
      progress: 10,
    });

    const optimizedQuery = await createOptimizedQuery(topic);
    console.log(`Optimized query created: "${optimizedQuery}"`);

    broadcastProgress({
      stage: "query_complete",
      message: "Research query optimized successfully",
      progress: 30,
      data: { queryPreview: optimizedQuery.substring(0, 100) + "..." },
    });

    // STEP 2: Make a SINGLE call to Perplexity with the optimized query
    broadcastProgress({
      stage: "research",
      message: "Performing deep research with Perplexity...",
      progress: 40,
    });

    const perplexityResults = await makePerplexitySonarQuery(optimizedQuery, {
      model: "sonar-deep-research",
      maxTokens: 16000,
      temperature: 0.2,
    });

    // Extract citations from Perplexity results
    const perplexityCitations = perplexityResults.citations.map(
      (url, index) => ({
        url,
        text: `Source ${index + 1}`,
        authors: `Source ${index + 1} Authors`,
      }),
    );

    broadcastProgress({
      stage: "research_complete",
      message: "Research data collected successfully",
      progress: 70,
      data: {
        citationsCount: perplexityResults.citations.length,
        contentPreview: perplexityResults.content.substring(0, 100) + "...",
      },
    });

    // STEP 3: Use Claude to structure the final output with proper academic formatting
    broadcastProgress({
      stage: "formatting",
      message: "Formatting research summary with Claude...",
      progress: 80,
    });

    const structuredOutput = await createStructuredOutput(
      topic,
      optimizedQuery,
      perplexityResults.content,
      perplexityCitations,
    );

    broadcastProgress({
      stage: "complete",
      message: "Research summary generated successfully",
      progress: 100,
      data: {
        title: structuredOutput.title,
        citationsCount: structuredOutput.citations.length,
      },
    });

    return {
      title: structuredOutput.title,
      content: structuredOutput.content,
      citations: structuredOutput.citations,
      modelUsed: "agentic-flow-claude-perplexity",
    };
  } catch (error) {
    console.error("Error in deep research agent flow:", error);

    // Broadcast error
    broadcastProgress({
      stage: "error",
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      progress: -1,
    });

    throw new Error(
      `Deep research agent failure: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Helper function to broadcast progress via WebSockets
function broadcastProgress(data: {
  stage: string;
  message: string;
  progress: number;
  data?: any;
}) {
  try {
    // Access the global broadcast function we defined in routes.ts
    if (typeof (global as any).broadcastResearchProgress === "function") {
      (global as any).broadcastResearchProgress(data);
    }
  } catch (error) {
    console.error("Error broadcasting progress:", error);
  }
}

/**
 * Uses Claude to create an optimized research query from user input
 */
async function createOptimizedQuery(userTopic: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2048,
      temperature: 0.1,
      system: `You are an expert research assistant that helps formulate precise, detailed search queries.
      Your task is to analyze the user's research topic or text and transform it into an optimized search query.
      Create a query that will yield comprehensive academic results when sent to a search system.
      Focus on extracting key concepts, using proper terminology, and including any relevant qualifiers.
      The query should be a single paragraph that thoroughly describes what information is being sought.
      Do not include any explanations or formatting - just output the optimized query text.`,
      messages: [
        {
          role: "user",
          content: `Please create an optimized research query from this topic or text: "${userTopic}"`,
        },
      ],
    });

    // Handle potential different response structures
    if (response.content[0].type === "text") {
      return response.content[0].text;
    } else {
      // Fallback to string representation if the expected structure isn't found
      return String(response.content[0]);
    }
  } catch (error) {
    console.error("Error creating optimized query with Claude:", error);
    // Fallback to original topic if Claude fails
    return userTopic;
  }
}

/**
 * Uses Claude to structure research results in academic format with proper citations
 */
async function createStructuredOutput(
  originalTopic: string,
  queryUsed: string,
  perplexityContent: string,
  perplexityCitations: Citation[],
): Promise<{ title: string; content: string; citations: Citation[] }> {
  try {
    // Prepare citation information for Claude
    const citationsText = perplexityCitations
      .map((citation, index) => `[${index + 1}] ${citation.url}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 16000,
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
          
Original topic: "${originalTopic}"
Query used: "${queryUsed}"

CONTENT FROM RESEARCH:
${perplexityContent}

AVAILABLE CITATIONS:
${citationsText}

Please format this as a professional academic paper introduction with proper citation integration.`,
        },
      ],
    });

    // Parse Claude's response to extract title and content
    let fullText = "";
    if (response.content[0].type === "text") {
      fullText = response.content[0].text.trim();
    } else {
      fullText = String(response.content[0]).trim();
    }

    const titleMatch = fullText.match(/^#\s+(.+?)(?:\n|$)/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : "Research on " + originalTopic;

    // Remove the title from the content if it exists
    let content = titleMatch
      ? fullText.replace(titleMatch[0], "").trim()
      : fullText;

    return {
      title,
      content,
      citations: perplexityCitations,
    };
  } catch (error) {
    console.error("Error creating structured output with Claude:", error);
    // Fallback to original content if Claude fails
    return {
      title: "Research on " + originalTopic,
      content: perplexityContent,
      citations: perplexityCitations,
    };
  }
}
