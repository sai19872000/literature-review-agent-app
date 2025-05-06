import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResearchSummary } from "@shared/schema";
import CitationsList from "./CitationsList";
import { useToast } from "@/hooks/use-toast";
import { checkDeepResearchStatus } from "@/lib/api";

interface OutputSectionProps {
  isProcessing: boolean;
  researchSummary: ResearchSummary | null;
  setResearchSummary?: (summary: ResearchSummary) => void; // Optional callback to update parent state
}

export default function OutputSection({ isProcessing, researchSummary, setResearchSummary }: OutputSectionProps) {
  const { toast } = useToast();
  const [localSummary, setLocalSummary] = useState<ResearchSummary | null>(researchSummary);

  const copyToClipboard = async () => {
    if (!researchSummary) return;
    
    try {
      const textToCopy = `${researchSummary.title}\n\n${researchSummary.content}\n\nREFERENCES\n${researchSummary.citations.map(citation => citation.text).join('\n')}`;
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

  const downloadAsFile = (fileType: 'pdf' | 'doc') => {
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
            <h3 className="font-serif text-xl font-bold mb-2">Generating Research Summary</h3>
            <p className="text-gray-600 mb-4">
              Analyzing sources and creating summary using Perplexity Sonar AI...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-accent h-2.5 rounded-full w-3/4 animate-pulse"></div>
            </div>
            {(researchSummary?.modelUsed === "sonar-deep-research" || researchSummary?.modelUsed === undefined) ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">
                    Deep Research Mode
                  </span>
                  This may take 1-2 minutes to complete
                </p>
                <p className="text-xs text-gray-500 italic">
                  Deep research performs a more comprehensive analysis with academic sources
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                This may take a minute depending on the complexity of the research
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
              <h3 className="font-serif text-xl font-bold mb-2">No Research Summary</h3>
              <p className="text-gray-600">
                Upload a PDF, enter text, or search by keywords to generate a research summary
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
                  onClick={() => downloadAsFile('pdf')}
                >
                  <i className="fas fa-file-pdf"></i>
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-accent"
                  title="Download as Word document"
                  onClick={() => downloadAsFile('doc')}
                >
                  <i className="fas fa-file-word"></i>
                </button>
              </div>
            </div>
            
            {/* Model information indicator */}
            {researchSummary.modelUsed && (
              <div className="flex items-center text-xs">
                <span className={`rounded-full px-2 py-1 mr-2 ${
                  researchSummary.modelUsed === "sonar-deep-research" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {researchSummary.modelUsed === "sonar-deep-research" 
                    ? "Deep Research Mode" 
                    : "Standard Research"}
                </span>
                <span className="text-gray-500">
                  Generated using {researchSummary.modelUsed}
                </span>
              </div>
            )}
          </div>

          {/* Summary Content */}
          <div className="prose max-w-none">
            <h2 className="font-serif text-2xl font-bold mb-4">{researchSummary.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: researchSummary.content }} />
            
            {/* Refresh button for deep research mode */}
            {researchSummary.modelUsed === "sonar-deep-research" && 
             researchSummary.content.includes("Deep Research in Progress") && (
              <div className="mt-6 flex justify-center">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md font-medium"
                  onClick={async () => {
                    // Extract topic from title or content
                    let topic = "";
                    if (researchSummary) {
                      if (researchSummary.title && researchSummary.title !== "Literature Review") {
                        topic = researchSummary.title;
                      } else {
                        // Try to extract from content - get the first few words after "Research in Progress"
                        const contentText = researchSummary.content || "";
                        const thinkMatch = contentText.match(/Deep Research in Progress.*?analyzing.*?sources/i);
                        if (thinkMatch) {
                          topic = contentText.substring(contentText.indexOf("analyzing") + 10, contentText.indexOf("sources") - 1);
                        }
                      }
                    }
                    
                    if (!topic) topic = "previous query"; // Fallback
                    
                    toast({
                      title: "Checking for updates",
                      description: "Retrieving the latest research progress...",
                    });
                    
                    try {
                      // Call the API to check for updates
                      const updatedSummary = await checkDeepResearchStatus(topic);
                      
                      // Check if we got a real update (not just another thinking state)
                      if (updatedSummary && !updatedSummary.content.includes("Deep Research in Progress")) {
                        toast({
                          title: "Research complete!",
                          description: "Your deep research results are now available.",
                        });
                        
                        // Update the UI with the complete research
                        if (setResearchSummary) {
                          setResearchSummary(updatedSummary);
                        } else {
                          setLocalSummary(updatedSummary);
                        }
                      } else {
                        toast({
                          title: "Deep research still in progress",
                          description: "Please check back in a few minutes as deep research can take 3-10 minutes to complete.",
                        });
                      }
                    } catch (error) {
                      console.error("Error checking for updates:", error);
                      toast({
                        title: "Error checking for updates",
                        description: error instanceof Error ? error.message : "Failed to check research status",
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
                  Check for Updates
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
