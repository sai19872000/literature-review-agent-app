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

// Available Perplexity models
type PerplexityModel =
  | "llama-3.1-sonar-small-128k-online"
  | "llama-3.1-sonar-large-128k-online"
  | "llama-3.1-sonar-huge-128k-online"
  | "sonar-deep-research";

/**
 * Configuration options for Perplexity API calls
 */
interface PerplexityOptions {
  model?: PerplexityModel;
  useDeepResearch?: boolean | string; // Allow string for form-data "true"/"false"
  maxTokens?: number;
  temperature?: number;
}

/**
 * Generates a research summary using Perplexity Sonar AI API
 *
 * @param text The text content to analyze and summarize
 * @param options Configuration options for the API call
 * @returns A research summary with citations
 */
export async function generateResearchSummary(
  text: string,
  options: PerplexityOptions = {},
): Promise<ResearchSummary> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }

    // Default to "llama-3.1-sonar-small-128k-online" unless deep research is enabled
    // Convert to boolean in case the value is a string "true" from form data
    const useDeepResearch =
      options.useDeepResearch === true || options.useDeepResearch === "true";

    console.log(`Deep research requested: ${useDeepResearch}`);

    const model = useDeepResearch
      ? "sonar-deep-research"
      : options.model || "llama-3.1-sonar-huge-128k-online";

    const maxTokens =
      options.maxTokens || (model === "sonar-deep-research" ? 500 : 150);
    const temperature = options.temperature || 0.2;

    console.log(
      `Calling Perplexity API with model: ${model}, text length: ${text.length}`,
    );
    console.log(`Using maxTokens: ${maxTokens}, temperature: ${temperature}`);
    console.log(
      `Deep research mode enabled: ${useDeepResearch ? "YES" : "NO"}`,
    );
    console.log(`Options received:`, JSON.stringify(options, null, 2));

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content:
              model === "sonar-deep-research"
                ? "You are a research assistant providing in-depth literature reviews with comprehensive citations. Focus on academic sources and peer-reviewed research."
                : "Be precise and concise in creating a literature review.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
        search_domain_filter: [
          "ncbi.nlm.nih.gov",
          "scholar.google.com",
          "sciencedirect.com",
        ],
        return_images: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 600000, // 10 minute timeout
      },
    );

    const perplexityResponse = response.data as PerplexityResponse;
    console.log(
      "Perplexity API response:",
      JSON.stringify(perplexityResponse, null, 2),
    );

    if (
      !perplexityResponse.choices ||
      perplexityResponse.choices.length === 0
    ) {
      throw new Error("Invalid response from Perplexity API");
    }

    // Get raw content from API response
    let content = perplexityResponse.choices[0].message.content;

    // Process content when it includes thinking tags for deep research mode
    if (content.includes("<think>")) {
      console.log("Detected thinking output from deep research mode...");

      // Extract the thinking content to display as intermediary output
      let thinkingContent = "";
      const thinkMatch = content.match(/<think>([\s\S]*?)(<\/think>|$)/);

      if (thinkMatch && thinkMatch[1]) {
        thinkingContent = thinkMatch[1].trim();

        // Format the thinking output for display
        if (thinkingContent.length > 0) {
          // Keep the thinking content but format it for display
          content = `
          <div class="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
            <h3 class="text-purple-800 font-medium mb-2">🧠 Deep Research in Progress</h3>
            <p class="text-sm text-purple-700 mb-4">The AI is currently analyzing academic sources. This preview shows its thinking process and will be replaced with the final research when complete.</p>
            <div class="text-sm text-gray-700 max-h-[300px] overflow-y-auto">
              ${thinkingContent.slice(0, 2000)}${thinkingContent.length > 2000 ? "..." : ""}
            </div>
          </div>

          <p class="text-center text-purple-700 py-4 mb-4 border-b border-t border-purple-200">
            <strong>Final research results will appear here when processing is complete.</strong><br>
            (This may take 3-10 minutes for comprehensive deep research)
          </p>`;
        }
      } else {
        // If we can't extract thinking content, provide a status message
        content = `
        <div class="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
          <h3 class="text-purple-800 font-medium mb-2">🧠 Deep Research in Progress</h3>
          <p class="text-purple-700">
            The AI is currently analyzing academic sources. Deep research mode typically takes 3-10 minutes to complete.
            Please wait while the analysis is being performed.
          </p>
          <div class="w-full bg-purple-200 h-2 mt-4 rounded-full overflow-hidden">
            <div class="bg-purple-600 h-full w-2/5 animate-pulse"></div>
          </div>
        </div>`;
      }
    }

    // Extract title from content
    const titleMatch =
      content.match(/^#+ (.+)$/m) || content.match(/^(.+?)(?:\n|$)/);

    const title = titleMatch ? titleMatch[1].trim() : "Literature Review";

    // Process citations from the API response
    const citations = processCitations(perplexityResponse.citations || []);

    // Create the research summary with model information
    const summary: ResearchSummary = {
      title,
      content,
      citations,
      modelUsed: perplexityResponse.model || model,
    };

    console.log("Generated research summary with title:", title);
    return summary;
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      console.error(
        "API error details:",
        JSON.stringify(responseData, null, 2),
      );
      throw new Error(
        `Perplexity API error: ${responseData?.error?.message || error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Direct call to Perplexity API without additional processing
 * Used for the agentic flow with Claude
 *
 * @param query The query to send to Perplexity
 * @param options API options
 * @returns The raw Perplexity response content and citations
 */
export async function makePerplexitySonarQuery(
  query: string,
  options: PerplexityOptions = {},
): Promise<{ content: string; citations: string[] }> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }

    console.log(
      `Making direct Perplexity query with model: ${options.model}, query length: ${query.length}`,
    );

    const model = options.model || "llama-3.1-sonar-huge-128k-online";
    const maxTokens = options.maxTokens || 16000;
    const temperature = options.temperature || 0.2;

    // Set a reasonable timeout for the API request (90 seconds)
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant providing detailed information. Include citations to all sources.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
        search_domain_filter: [
          "ncbi.nlm.nih.gov",
          "scholar.google.com",
          "sciencedirect.com",
        ],
        return_images: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 600000, // 10 minute timeout
      },
    );

    const perplexityResponse = response.data as PerplexityResponse;

    if (
      !perplexityResponse.choices ||
      perplexityResponse.choices.length === 0
    ) {
      throw new Error("Invalid response from Perplexity API");
    }

    // Return the raw content and citations without processing
    return {
      content: perplexityResponse.choices[0].message.content,
      citations: perplexityResponse.citations || [],
    };
  } catch (error) {
    console.error("Error making direct Perplexity query:", error);
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      console.error(
        "API error details:",
        JSON.stringify(responseData, null, 2),
      );
      throw new Error(
        `Perplexity API error: ${responseData?.error?.message || error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Process citation URLs from Perplexity API into structured Citation objects
 * Exported so it can be used by other services
 */
export function processCitations(citationUrls: string[]): Citation[] {
  return citationUrls.map((url, index) => {
    // Extract domain name for a basic author reference
    const domainMatch = url.match(/https?:\/\/(?:www\.)?([^\/]+)/i);
    const domain = domainMatch
      ? domainMatch[1].replace(/\.(com|org|edu|gov|net)$/i, "")
      : "Unknown Source";

    // Format domain for better readability as author
    const formattedDomain = domain
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    
    // Extract additional citation information when possible
    let text = `${url}`;
    
    // Parse URLs from different sources to extract more information
    if (url.includes("pubmed.ncbi.nlm.nih.gov") || url.includes("pmc.ncbi.nlm.nih.gov")) {
      // Try to format PubMed/PMC citations more academically
      const articleMatch = url.match(/PMC(\d+)/i);
      const pubmedMatch = url.match(/pubmed\/(\d+)/i);
      const articleId = articleMatch ? articleMatch[1] : (pubmedMatch ? pubmedMatch[1] : null);
      
      if (articleId) {
        text = `PubMed/PMC Article ID: ${articleId}. Retrieved from ${url}`;
      }
    } else if (url.includes("doi.org")) {
      // Format DOI citations
      const doiMatch = url.match(/doi\.org\/(.+)$/i);
      if (doiMatch) {
        text = `DOI: ${doiMatch[1]}. Retrieved from ${url}`;
      }
    } else {
      // Generic formatting for other URLs
      text = `Retrieved from ${url}`;
    }

    // Create a citation with domain as author
    return {
      authors: `${formattedDomain} (n.d.)`,
      text: text,
      url,
    };
  });
}
