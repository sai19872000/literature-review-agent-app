import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResearchSummary, Citation } from "@shared/schema";
import CitationsList from "./CitationsList";
import { useToast } from "@/hooks/use-toast";
import { performAgenticDeepResearch } from "@/lib/api";

interface OutputSectionProps {
  isProcessing: boolean;
  researchSummary: ResearchSummary | null;
  setResearchSummary?: (summary: ResearchSummary) => void; // Optional callback to update parent state
}

export default function OutputSection({
  isProcessing,
  researchSummary,
  setResearchSummary,
}: OutputSectionProps) {
  const { toast } = useToast();
  const [localSummary, setLocalSummary] = useState<ResearchSummary | null>(
    researchSummary,
  );

  // Filter and deduplicate citations based on title and content
  const getUniqueReferences = (citations: Citation[]): Citation[] => {
    // Skip if not enough citations
    if (!citations || citations.length <= 1) {
      return citations;
    }

    // Extract titles from citation text for deduplication
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueCitations: Citation[] = [];

    // Create map to track old index -> new index for renumbering in content
    const citationMap = new Map<number, number>();

    citations.forEach((citation, oldIndex) => {
      // Clean and extract title from text
      const cleanText = citation.text || "";
      const titleMatch = cleanText.match(/\)\.\s([^\.]+)/);
      const title = titleMatch
        ? titleMatch[1].trim().toLowerCase()
        : `citation-${oldIndex}`;
      const url = citation.url ? citation.url.toLowerCase() : `url-${oldIndex}`;

      // Skip duplicates based on title or URL
      if (seenTitles.has(title) || seenUrls.has(url)) {
        // Find which index this duplicate maps to
        for (let i = 0; i < uniqueCitations.length; i++) {
          // Check for null/undefined before accessing properties
          if (!uniqueCitations[i]) continue;

          // Get text with proper type checking
          const existingCitation = uniqueCitations[i];
          const existingCleanText =
            existingCitation && typeof existingCitation.text === "string"
              ? existingCitation.text
              : "";
          const existingTitleMatch = existingCleanText.match(/\)\.\s([^\.]+)/);
          const existingTitle =
            existingTitleMatch && existingTitleMatch[1]
              ? existingTitleMatch[1].trim().toLowerCase()
              : "";

          // Handle URL with null check using the already defined existingCitation
          let existingUrl = "";
          if (existingCitation && existingCitation.url) {
            existingUrl = String(existingCitation.url).toLowerCase();
          }

          if (title === existingTitle || url === existingUrl) {
            citationMap.set(oldIndex + 1, i + 1); // +1 because citation numbers start at 1
            break;
          }
        }
      } else {
        // Add to unique list and track mapping
        citationMap.set(oldIndex + 1, uniqueCitations.length + 1); // +1 because citation numbers start at 1
        uniqueCitations.push(citation);

        // Add this title and URL to seen sets
        seenTitles.add(title);
        seenUrls.add(url);
      }
    });

    return uniqueCitations;
  };

  // Function to update citation numbers in content
  const updateContentCitationNumbers = (
    content: string,
    citationMap: Map<number, number>,
  ): string => {
    if (!content || citationMap.size === 0) return content;

    // Replace citation numbers using regex
    let updatedContent = content;

    // Replace citation numbers in the format [X]
    // Use Array.from to avoid iterator issues with TypeScript
    Array.from(citationMap.entries()).forEach(([oldNum, newNum]) => {
      const regex = new RegExp(`\\[${oldNum}\\]`, "g");
      updatedContent = updatedContent.replace(regex, `[${newNum}]`);
    });

    return updatedContent;
  };

  // Use useEffect to update local state and process citations when props change
  useEffect(() => {
    if (
      researchSummary &&
      researchSummary.citations &&
      researchSummary.citations.length > 0
    ) {
      // Process citations to ensure uniqueness
      const uniqueCitations = getUniqueReferences(researchSummary.citations);

      // Create a citation mapping for renumbering
      // We need to map from original citation indices to new indices after deduplication
      const citationMap = new Map<number, number>();

      // We need to build the full mapping from old indices to new ones
      const originalCitations = researchSummary.citations;

      // First build a map of what's being deduplicated
      for (let oldIdx = 0; oldIdx < originalCitations.length; oldIdx++) {
        let foundMatch = false;
        const citation = originalCitations[oldIdx];

        // Extract identifying information
        const cleanText = citation.text || "";
        const titleMatch = cleanText.match(/\)\.\s([^\.]+)/);
        const title = titleMatch
          ? titleMatch[1].trim().toLowerCase()
          : `citation-${oldIdx}`;
        const url = citation.url ? citation.url.toLowerCase() : `url-${oldIdx}`;

        // Find where this appears in uniqueCitations, if at all
        for (let newIdx = 0; newIdx < uniqueCitations.length; newIdx++) {
          const uniqueCitation = uniqueCitations[newIdx];
          const uniqueCleanText = uniqueCitation.text || "";
          const uniqueTitleMatch = uniqueCleanText.match(/\)\.\s([^\.]+)/);
          const uniqueTitle = uniqueTitleMatch
            ? uniqueTitleMatch[1].trim().toLowerCase()
            : ``;
          const uniqueUrl = uniqueCitation.url
            ? uniqueCitation.url.toLowerCase()
            : ``;

          if (
            title === uniqueTitle ||
            url === uniqueUrl ||
            (citation.authors === uniqueCitation.authors &&
              citation.text &&
              uniqueCitation.text &&
              citation.text.includes(
                uniqueCitation.text.substring(
                  0,
                  Math.min(20, uniqueCitation.text.length),
                ),
              ))
          ) {
            citationMap.set(oldIdx + 1, newIdx + 1);
            foundMatch = true;
            break;
          }
        }

        // If no match found, this is weird but we'll use the original number
        if (!foundMatch) {
          citationMap.set(oldIdx + 1, oldIdx + 1);
        }
      }

      // Renumber citations in the content
      const updatedContent = updateContentCitationNumbers(
        researchSummary.content,
        citationMap,
      );

      // Create updated summary with unique citations and renumbered content
      const updatedSummary = {
        ...researchSummary,
        content: updatedContent,
        citations: uniqueCitations,
      };

      setLocalSummary(updatedSummary);
    } else {
      setLocalSummary(researchSummary);
    }
  }, [researchSummary]);

  const copyToClipboard = async () => {
    if (!researchSummary) return;

    try {
      const textToCopy = `${researchSummary.title}\n\n${researchSummary.content}\n\nREFERENCES\n${researchSummary.citations.map((citation) => citation.text).join("\n")}`;
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Success",
        description: "Research summary copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = (fileType: "pdf" | "doc") => {
    toast({
      title: "Coming Soon",
      description: `Download as ${fileType.toUpperCase()} will be available in a future update`,
    });
  };

  if (isProcessing) {
    return (
      <section className="lg:w-3/5">
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
            <h3 className="font-serif text-xl font-bold mb-2">
              Generating Research Summary
            </h3>
            <p className="text-gray-600 mb-4">
              Analyzing sources and creating summary using Tapawize AI...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-accent h-2.5 rounded-full w-3/4 animate-pulse"></div>
            </div>
            {isProcessing &&
            researchSummary?.modelUsed === "sonar-deep-research" ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">
                    Deep Research Mode
                  </span>
                  This may take 1-2 minutes to complete
                </p>
                <p className="text-xs text-gray-500 italic">
                  Deep research performs a more comprehensive analysis with
                  academic sources
                </p>
              </div>
            ) : isProcessing &&
              researchSummary?.title ===
                "Enhanced Original Text with Citations" ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs mr-2">
                    Preserve Original Text Mode
                  </span>
                  This may take few minutes to complete
                </p>
                <p className="text-xs text-gray-500 italic">
                  Enhancing your text with authentic citations from academic
                  sources
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                This may take few minutes depending on the complexity of the
                research
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!researchSummary || !researchSummary.content) {
    return (
      <section className="lg:w-3/5">
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <div className="py-12">
              <i className="fas fa-file-alt text-5xl text-gray-400 mb-4"></i>
              <h3 className="font-serif text-xl font-bold mb-2">
                No Research Summary
              </h3>
              <p className="text-gray-600">
                Enter text or search by keywords to generate a research summary
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="lg:w-3/5">
      {/* Results Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-serif text-xl font-bold">Research Summary</h3>
              <div className="flex space-x-2">
                <button
                  className="p-2 text-gray-600 hover:text-accent"
                  title="Copy to clipboard"
                  onClick={copyToClipboard}
                >
                  <i className="fas fa-copy"></i>
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-accent"
                  title="Download as PDF"
                  onClick={() => downloadAsFile("pdf")}
                >
                  <i className="fas fa-file-pdf"></i>
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-accent"
                  title="Download as Word document"
                  onClick={() => downloadAsFile("doc")}
                >
                  <i className="fas fa-file-word"></i>
                </button>
              </div>
            </div>

            {/* Model information indicator */}
            {researchSummary.modelUsed && (
              <div className="flex items-center text-xs">
                <span
                  className={`rounded-full px-2 py-1 mr-2 ${
                    researchSummary.modelUsed === "sonar-deep-research" ||
                    researchSummary.modelUsed === "sonar-pro"
                      ? "bg-purple-100 text-purple-700"
                      : researchSummary.title ===
                          "Enhanced Original Text with Citations"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {researchSummary.modelUsed === "sonar-deep-research"
                    ? "Deep Research Mode"
                    : researchSummary.title ===
                        "Enhanced Original Text with Citations"
                      ? "Preserve Original Text Mode"
                      : "Deep Research Mode"}
                </span>
                <span className="text-gray-500">
                  Generated using {researchSummary.modelUsed}
                </span>
              </div>
            )}
          </div>

          {/* Summary Content */}
          <div className="prose max-w-none">
            <h2 className="font-serif text-2xl font-bold mb-4">
              {researchSummary.title}
            </h2>
            <div
              dangerouslySetInnerHTML={{ __html: researchSummary.content }}
            />

            {/* Research Again button for deep research mode */}
            {researchSummary.modelUsed === "sonar-deep-research" && (
              <div className="mt-6 flex justify-center">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md font-medium"
                  onClick={async () => {
                    // Extract topic from title or content
                    let topic = "";
                    if (researchSummary) {
                      if (
                        researchSummary.title &&
                        researchSummary.title !== "Literature Review"
                      ) {
                        topic = researchSummary.title;
                      } else {
                        // Extract the main topic from the content
                        const contentText = researchSummary.content || "";

                        // Just use the first 100 characters if we can't find a better topic
                        topic = contentText.substring(0, 100);
                      }
                    }

                    if (!topic) topic = "previous query"; // Fallback

                    toast({
                      title: "Starting new research",
                      description: "Performing deep research on this topic...",
                    });

                    try {
                      // Perform a new agentic deep research request with the same topic
                      const updatedSummary =
                        await performAgenticDeepResearch(topic);

                      toast({
                        title: "Research complete!",
                        description:
                          "Fresh research results are now available.",
                      });

                      // Update the UI with the latest content
                      if (setResearchSummary) {
                        setResearchSummary(updatedSummary);
                      } else {
                        setLocalSummary(updatedSummary);
                      }
                    } catch (error: any) {
                      console.error("Error performing research:", error);
                      toast({
                        title: "Error with research",
                        description:
                          error instanceof Error
                            ? error.message
                            : "Failed to complete research",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Research Again
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Citations Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-bold border-b border-gray-200 pb-4 mb-6">
            References
          </h3>
          <CitationsList citations={researchSummary.citations} />
        </CardContent>
      </Card>
    </section>
  );
}
