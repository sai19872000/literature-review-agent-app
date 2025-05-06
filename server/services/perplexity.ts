import axios from "axios";
import { ResearchSummary, Citation } from "@shared/schema";

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }[];
  citations: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size?: string;
  };
}

/**
 * Generates a research summary using Perplexity Sonar AI API
 * 
 * @param text The text content to analyze and summarize
 * @returns A research summary with citations
 */
export async function generateResearchSummary(text: string): Promise<ResearchSummary> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }

    console.log("Calling Perplexity API with text length:", text.length);

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "Be precise and concise in creating a literature review."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 150
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const perplexityResponse = response.data as PerplexityResponse;
    console.log("Perplexity API response:", JSON.stringify(perplexityResponse, null, 2));
    
    if (!perplexityResponse.choices || perplexityResponse.choices.length === 0) {
      throw new Error("Invalid response from Perplexity API");
    }

    const content = perplexityResponse.choices[0].message.content;
    
    // Extract title from content
    const titleMatch = content.match(/^#+ (.+)$/m) || 
                       content.match(/^(.+?)(?:\n|$)/);
                     
    const title = titleMatch ? titleMatch[1].trim() : "Literature Review";
    
    // Process citations from the API response
    const citations = processCitations(perplexityResponse.citations || []);

    // Create the research summary
    const summary: ResearchSummary = {
      title,
      content,
      citations
    };
    
    console.log("Generated research summary with title:", title);
    return summary;
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      console.error("API error details:", JSON.stringify(responseData, null, 2));
      throw new Error(`Perplexity API error: ${responseData?.error?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Process citation URLs from Perplexity API into structured Citation objects
 */
function processCitations(citationUrls: string[]): Citation[] {
  return citationUrls.map((url, index) => {
    // Extract domain name for a basic author reference
    const domainMatch = url.match(/https?:\/\/(?:www\.)?([^\/]+)/i);
    const domain = domainMatch 
      ? domainMatch[1].replace(/\.(com|org|edu|gov|net)$/i, '')
      : "Unknown Source";
    
    // Format domain for better readability as author
    const formattedDomain = domain
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    
    // Create a citation with domain as author
    return {
      authors: `${formattedDomain} (n.d.)`,
      text: `Resource ${index + 1}: ${url.split('/').slice(0, 3).join('/')}`,
      url
    };
  });
}
