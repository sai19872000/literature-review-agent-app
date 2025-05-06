import axios from "axios";
import { ResearchSummary, Citation } from "@shared/schema";

interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
  citations?: string[];
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

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: `You are a research assistant tasked with creating comprehensive literature reviews. 
            Format your responses using HTML paragraphs, headers, and other formatting as needed. 
            Create a well-structured academic literature review that includes:
            1. A title for the research topic
            2. An introduction section
            3. Themed sections based on the content
            4. A conclusion section
            5. Citations in APA format
            
            Extract direct quotes when relevant and cite them properly. Organize the summary by themes 
            when possible. Aim for a scholarly tone and structure.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9,
        search_domain_filter: ["scientific", "academic"],
        return_related_questions: false,
        search_recency_filter: "year",
        frequency_penalty: 1
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const perplexityResponse = response.data as PerplexityResponse;
    
    if (!perplexityResponse.choices || perplexityResponse.choices.length === 0) {
      throw new Error("Invalid response from Perplexity API");
    }

    const content = perplexityResponse.choices[0].message.content;
    
    // Extract title and content
    const titleMatch = content.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i) || 
                     content.match(/^#+ (.+)$/m) ||
                     content.match(/^(.+?)(?:\n|$)/);
                     
    const title = titleMatch ? titleMatch[1].trim() : "Literature Review";
    
    // Process citations from the API response
    const citations = processCitations(perplexityResponse.citations || []);

    return {
      title,
      content,
      citations
    };
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Perplexity API error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Process citation URLs from Perplexity API into structured Citation objects
 */
function processCitations(citationUrls: string[]): Citation[] {
  return citationUrls.map((url) => {
    // Extract domain name for a basic author reference if we can't parse it better
    const domainMatch = url.match(/https?:\/\/(?:www\.)?([^\/]+)/i);
    const domain = domainMatch ? domainMatch[1] : "Unknown Source";
    
    // Create a basic citation, in a real app this would parse more information from the URL
    return {
      authors: `${domain} (n.d.)`,
      text: `. Retrieved from ${url}`,
      url
    };
  });
}
