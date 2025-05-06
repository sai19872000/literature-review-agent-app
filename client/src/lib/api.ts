import { apiRequest } from "./queryClient";
import { GenerateResearchRequest, ResearchSummary } from "@shared/schema";

/**
 * Generate a research summary based on the provided input
 */
export async function generateResearch(
  request: GenerateResearchRequest
): Promise<ResearchSummary> {
  let endpoint = "";
  let payload: any = {};

  switch (request.type) {
    case "pdf": {
      endpoint = "/api/research/pdf";
      const formData = new FormData();
      formData.append("file", request.pdfFile);
      
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
      payload = { text: request.text };
      break;
    }

    case "keywords": {
      endpoint = "/api/research/keywords";
      payload = { 
        keywords: request.keywords,
        sourcesLimit: request.sourcesLimit
      };
      break;
    }
  }

  const response = await apiRequest("POST", endpoint, payload);
  return await response.json();
}
