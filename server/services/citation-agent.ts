import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import { ResearchSummary, Citation } from "@shared/schema";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Perplexity API settings
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Types for the citation agent
 */
interface CitationSource {
  title: string;
  authors: string[];
  year: string;
  journal?: string;
  url?: string;
  doi?: string;
  isOriginalResearch: boolean;
}

interface SourceFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  sources: CitationSource[];
}

interface EnhancedText {
  originalText: string;
  enhancedText: string;
  citations: Citation[];
}

/**
 * Main function to enhance text with original citations
 * @param text The original text to enhance with citations
 * @returns The enhanced text with citations and a list of citations
 */
export async function enhanceTextWithCitations(
  text: string,
): Promise<EnhancedText> {
  try {
    console.log(
      "Starting citation enhancement process for text of length:",
      text.length,
    );

    // Step 1: Identify claims that need citations using Claude
    const fragments = await identifyClaimsNeedingCitations(text);
    console.log(`Identified ${fragments.length} claims needing citations`);

    // Step 2: For each claim, find relevant sources using Perplexity
    let enhancedText = text;
    const allCitations: Citation[] = [];
    let citationCount = 0;

    for (const fragment of fragments) {
      // Search for original sources for this claim
      const sources = await findOriginalSources(fragment.text);
      console.log(
        `Found ${sources.length} sources for claim: "${fragment.text.substring(0, 50)}..."`,
      );

      if (sources.length > 0) {
        // Insert citations into the text
        const citationIndices = sources.map(() => ++citationCount);
        const citationText = `[${citationIndices.join(", ")}]`;

        // Create citation objects
        const newCitations = sources.map((source, index) => {
          return formatCitation(source, citationIndices[index]);
        });

        // Add to our collection
        allCitations.push(...newCitations);

        // Replace in the text - careful with indices as we modify the text
        const offset = enhancedText.length - text.length;
        const insertPosition = fragment.endIndex + offset;
        enhancedText =
          enhancedText.substring(0, insertPosition) +
          citationText +
          enhancedText.substring(insertPosition);
      }
    }

    return {
      originalText: text,
      enhancedText,
      citations: allCitations,
    };
  } catch (error) {
    console.error("Error enhancing text with citations:", error);
    throw new Error("Failed to enhance text with citations");
  }
}

/**
 * Step 1: Identify claims in the text that need citations
 */
async function identifyClaimsNeedingCitations(
  text: string,
): Promise<SourceFragment[]> {
  try {
    const prompt = `
      I want to identify factual claims in the following text that would benefit from academic citations. 
      Please identify statements that:
      1. Make factual claims about research findings
      2. Present statistics or data
      3. Describe scientific consensus or established knowledge
      4. Reference specific studies or research
      
      For each claim, provide:
      - The exact text of the claim
      - The start and end character indices of the claim in the original text
      
      Respond in this JSON format:
      {
        "claims": [
          {
            "text": "exact text of the claim",
            "startIndex": start_character_index,
            "endIndex": end_character_index
          },
          ...
        ]
      }
      
      Here's the text:
      
      ${text}
    `;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    });

    // Parse the JSON response
    const contentBlock = response.content[0];

    if (contentBlock.type !== "text") {
      throw new Error("Unexpected response format from Anthropic");
    }

    const content = contentBlock.text;
    // Extract JSON from the response (handle potential markdown formatting)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const data = JSON.parse(jsonMatch[0]);

    // Convert to our SourceFragment type
    return data.claims.map((claim: any) => ({
      text: claim.text,
      startIndex: claim.startIndex,
      endIndex: claim.endIndex,
      sources: [],
    }));
  } catch (error) {
    console.error("Error identifying claims:", error);
    return []; // Return empty array instead of failing completely
  }
}

/**
 * Step 2: Find original sources for each claim
 */
async function findOriginalSources(
  claimText: string,
): Promise<CitationSource[]> {
  try {
    // First we use Perplexity API to search for relevant sources
    const searchResponse = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are an academic citation assistant. Your goal is to find the ORIGINAL research papers that first discovered or established the fact in the claim. 
            Do not cite review papers or secondary sources unless absolutely necessary. Focus on finding primary research articles.
            For each source, provide:
            1. Full title
            2. Author list
            3. Publication year
            4. Journal name
            5. DOI or URL
            6. Whether it's original research or a review/secondary source
            
            Respond in JSON format only.`,
          },
          {
            role: "user",
            content: `Find the original academic sources for this claim: "${claimText}". Return the 3 most relevant sources in JSON format.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Now we use Claude to analyze these results and pick the best original sources
    const sourceData = searchResponse.data;

    // Extract the content
    const perplexityContent = sourceData.choices[0].message.content;

    // Use Claude to process and extract the original sources
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `
          Analyze these search results about the claim: "${claimText}"
          
          Search results:
          ${perplexityContent}
          
          Extract and filter the sources to identify only original research papers (not reviews or secondary sources).
          For each source, determine if it's likely to be the original research that first established the fact.
          
          Return your analysis in this JSON format:
          {
            "sources": [
              {
                "title": "paper title",
                "authors": ["author1", "author2"],
                "year": "publication year",
                "journal": "journal name",
                "url": "URL if available",
                "doi": "DOI if available",
                "isOriginalResearch": true/false
              }
            ]
          }
          
          Return the JSON object only with no other text.
          `,
        },
      ],
    });

    // Extract and parse the JSON from response
    const contentBlock = response.content[0];

    if (contentBlock.type !== "text") {
      return []; // If not a text block, return empty array
    }

    const content = contentBlock.text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return []; // If no matches, return empty array
    }

    const data = JSON.parse(jsonMatch[0]);
    return data.sources;
  } catch (error) {
    console.error("Error finding original sources:", error);
    return []; // Return empty array on error
  }
}

/**
 * Format citation source into our Citation type
 */
function formatCitation(source: CitationSource, index: number): Citation {
  const authors = source.authors.join(", ");
  const year = source.year || "n.d.";
  const title = source.title;
  const journal = source.journal || "";

  let citationText = `${authors} (${year}). ${title}.`;
  if (journal) {
    citationText += ` ${journal}.`;
  }

  return {
    authors: `${authors} (${year})`,
    text: citationText,
    url: source.url || source.doi || undefined,
  };
}
