import { apiRequest } from "./queryClient";
import { GenerateResearchRequest, ResearchSummary, EnhancedTextResponse } from "@shared/schema";

/**
 * Generate a research summary based on the provided input
 */
export async function generateResearch(
  request: GenerateResearchRequest,
  options?: { useDeepResearch?: boolean; maxTokens?: number }
): Promise<ResearchSummary> {
  let endpoint = "";
  let payload: any = {};

  // Include research options if provided
  const deepResearchOptions = options?.useDeepResearch 
    ? { 
        useDeepResearch: true,
        maxTokens: options.maxTokens || 800 // Default to 800 tokens for deep research
      } 
    : undefined;

  switch (request.type) {
    case "pdf": {
      endpoint = "/api/research/pdf";
      const formData = new FormData();
      formData.append("file", request.pdfFile);
      
      // Add deep research flag if needed
      if (deepResearchOptions) {
        formData.append("useDeepResearch", "true");
        if (deepResearchOptions.maxTokens) {
          formData.append("maxTokens", deepResearchOptions.maxTokens.toString());
        }
      }
      
      // Using fetch directly instead of apiRequest for FormData
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error generating research: ${errorText}`);
      }
      
      return await response.json();
    }

    case "text": {
      endpoint = "/api/research/text";
      payload = { 
        text: request.text,
        ...deepResearchOptions
      };
      break;
    }

    case "keywords": {
      endpoint = "/api/research/keywords";
      payload = { 
        keywords: request.keywords,
        sourcesLimit: request.sourcesLimit,
        ...deepResearchOptions
      };
      break;
    }
  }

  const response = await apiRequest("POST", endpoint, payload);
  return await response.json();
}

/**
 * Enhance text with original citations using the agentic citation flow
 * @param text The text to enhance with citations
 * @returns Enhanced text with original citations
 */
export async function enhanceTextWithCitations(text: string): Promise<EnhancedTextResponse> {
  try {
    const response = await apiRequest("POST", "/api/enhance-text", { text });
    return await response.json();
  } catch (error) {
    console.error("Error enhancing text with citations:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to enhance text with citations");
  }
}

/**
 * Perform agentic deep research using Claude + Perplexity workflow
 * This makes only a single API call per research request
 * 
 * @param text The text or topic to research
 * @returns A properly formatted research summary with citations
 */
export async function performAgenticDeepResearch(text: string): Promise<ResearchSummary> {
  try {
    console.log("Starting agentic deep research for:", text);
    const response = await apiRequest("POST", "/api/research/agentic-deep", { text });
    return await response.json();
  } catch (error) {
    console.error("Error performing agentic deep research:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to perform agentic deep research");
  }
}
