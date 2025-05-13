import { apiRequest } from "./queryClient";
import { GenerateResearchRequest, ResearchSummary, EnhancedTextResponse } from "@shared/schema";

/**
 * Generate a research summary based on the provided input
 */
export async function generateResearch(
  request: GenerateResearchRequest,
  options?: { useDeepResearch?: boolean; maxTokens?: number }
): Promise<ResearchSummary> {
  const endpoint = "/api/research/generate";
  
  // Add deep research flag if needed
  const isDeepResearch = options?.useDeepResearch || false;
  const maxTokens = options?.maxTokens;
  
  // Handle PDF uploads with FormData
  if (request.type === "pdf") {
    const formData = new FormData();
    
    // Add the file
    if (request.pdfFile) {
      formData.append("file", request.pdfFile);
    }
    
    // Add request metadata
    formData.append("type", "pdf");
    formData.append("isDeepResearch", isDeepResearch.toString());
    
    if (maxTokens) {
      formData.append("maxTokens", maxTokens.toString());
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
  
  // For text and keywords, we can use JSON
  const payload = {
    ...request,
    isDeepResearch,
    maxTokens
  };
  
  const response = await apiRequest("POST", endpoint, payload);
  return await response.json();
}

/**
 * Options for research API calls
 */
export interface ResearchOptions {
  searchDomains?: string[];  // List of academic domains to restrict searches to
  maxTokens?: number;        // Maximum tokens for the response
}

/**
 * Enhance text with original citations using the agentic citation flow
 * @param text The text to enhance with citations
 * @param options Optional settings including search domains
 * @returns Enhanced text with original citations
 */
export async function enhanceTextWithCitations(
  text: string, 
  options?: ResearchOptions
): Promise<EnhancedTextResponse> {
  try {
    const payload: any = { text };
    
    // Add search domains if provided
    if (options?.searchDomains && options.searchDomains.length > 0) {
      payload.searchDomains = options.searchDomains;
    }
    
    // Add max tokens if provided
    if (options?.maxTokens) {
      payload.maxTokens = options.maxTokens;
    }
    
    const response = await apiRequest("POST", "/api/enhance-text", payload);
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
 * @param options Optional settings including search domains
 * @returns A properly formatted research summary with citations
 */
export async function performAgenticDeepResearch(
  text: string,
  options?: ResearchOptions
): Promise<ResearchSummary> {
  try {
    console.log("Starting agentic deep research for:", text);
    
    const payload: any = { text };
    
    // Add search domains if provided
    if (options?.searchDomains && options.searchDomains.length > 0) {
      payload.searchDomains = options.searchDomains;
    }
    
    // Add max tokens if provided
    if (options?.maxTokens) {
      payload.maxTokens = options.maxTokens;
    }
    
    const response = await apiRequest("POST", "/api/research/agentic-deep", payload);
    return await response.json();
  } catch (error) {
    console.error("Error performing agentic deep research:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to perform agentic deep research");
  }
}
