import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ResearchForm from "./ResearchForm";
import { ResearchSummary, GenerateResearchRequest, EnhancedTextResponse } from "@shared/schema";
import { generateResearch, enhanceTextWithCitations } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InputSectionProps {
  onGenerationStart: () => void;
  onGenerationComplete: (data: ResearchSummary) => void;
  isProcessing: boolean;
}

export default function InputSection({ 
  onGenerationStart, 
  onGenerationComplete,
  isProcessing
}: InputSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upload" | "text" | "keywords">("upload");
  const [preserveOriginalText, setPreserveOriginalText] = useState<boolean>(false);
  const [useDeepResearch, setUseDeepResearch] = useState<boolean>(false);
  // Tracking if we're using deep research for the loading state
  const [isUsingDeepResearch, setIsUsingDeepResearch] = useState<boolean>(false);

  const handleSubmit = async (formData: GenerateResearchRequest) => {
    try {
      // Update deep research mode state
      setIsUsingDeepResearch(useDeepResearch);
      
      // Tell parent component we're starting
      onGenerationStart();
      
      // If text input mode is selected and preserveOriginalText is enabled, use enhanceTextWithCitations
      if (preserveOriginalText && formData.type === "text") {
        const enhancedResult = await enhanceTextWithCitations(formData.text);
        
        // Convert the enhanced text response to a research summary format
        // so it works with our existing UI
        const result: ResearchSummary = {
          title: "Enhanced Original Text with Citations",
          content: enhancedResult.enhancedText,
          citations: enhancedResult.citations,
          modelUsed: "claude-3.7-sonnet-20250219" // Always Claude for enhanced text
        };
        
        onGenerationComplete(result);
      } else {
        // Configure deep research options if enabled
        const researchOptions = useDeepResearch 
          ? { 
              useDeepResearch: true,
              maxTokens: 800 // Use a higher token limit for deep research
            } 
          : undefined;
          
        // Call the generateResearch API with options
        const result = await generateResearch(formData, researchOptions);
        onGenerationComplete(result);
      }
    } catch (error) {
      console.error("Error generating research:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate research summary",
        variant: "destructive",
      });
      onGenerationComplete({
        title: "",
        content: "",
        citations: []
      });
    }
  };

  return (
    <section className="lg:w-2/5">
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 pb-2 border-b border-gray-200">
            Research Input
          </h3>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-2 px-4 font-medium ${
                activeTab === "upload"
                  ? "text-accent border-b-2 border-accent"
                  : "text-gray-500 hover:text-accent"
              }`}
            >
              <i className="fas fa-file-upload mr-2"></i>Upload PDF
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`py-2 px-4 font-medium ${
                activeTab === "text"
                  ? "text-accent border-b-2 border-accent"
                  : "text-gray-500 hover:text-accent"
              }`}
            >
              <i className="fas fa-align-left mr-2"></i>Text Input
            </button>
            <button
              onClick={() => setActiveTab("keywords")}
              className={`py-2 px-4 font-medium ${
                activeTab === "keywords"
                  ? "text-accent border-b-2 border-accent"
                  : "text-gray-500 hover:text-accent"
              }`}
            >
              <i className="fas fa-search mr-2"></i>Keywords
            </button>
          </div>

          <ResearchForm 
            activeTab={activeTab} 
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Configuration Options Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 pb-2 border-b border-gray-200">
            Configuration
          </h3>

          <div className="mb-4">
            <label htmlFor="citation-style" className="block mb-2 font-medium">
              Citation Style
            </label>
            <select
              id="citation-style"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              defaultValue="apa"
            >
              <option value="apa">APA 7th Edition</option>
              <option value="mla">MLA 9th Edition</option>
              <option value="chicago">Chicago 17th Edition</option>
              <option value="harvard">Harvard</option>
              <option value="ieee">IEEE</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="summary-length" className="block mb-2 font-medium">
              Summary Length
            </label>
            <select
              id="summary-length"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              defaultValue="medium"
            >
              <option value="short">Brief (250 words)</option>
              <option value="medium">Standard (500 words)</option>
              <option value="long">Comprehensive (1000 words)</option>
            </select>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="include-quotes"
              className="w-5 h-5 text-accent focus:ring-accent rounded"
              defaultChecked
            />
            <label htmlFor="include-quotes" className="ml-2 font-medium">
              Include direct quotes when relevant
            </label>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="organize-themes"
              className="w-5 h-5 text-accent focus:ring-accent rounded"
              defaultChecked
            />
            <label htmlFor="organize-themes" className="ml-2 font-medium">
              Organize summary by themes
            </label>
          </div>
          
          {/* Toggle for preserving original text mode */}
          <div className="flex items-center mt-6 pt-4 border-t border-gray-200">
            <input
              type="checkbox"
              id="preserve-original"
              className="w-5 h-5 text-accent focus:ring-accent rounded"
              checked={preserveOriginalText}
              onChange={(e) => setPreserveOriginalText(e.target.checked)}
            />
            <label htmlFor="preserve-original" className="ml-2 font-medium">
              Preserve original text (only for Text Input)
            </label>
            {preserveOriginalText && (
              <div className="flex items-center ml-4">
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                  Using Claude 3.7 + Perplexity agent
                </span>
              </div>
            )}
          </div>
          
          {preserveOriginalText && (
            <div className="mt-2 text-sm text-gray-600 pl-7">
              This mode will preserve your original text and add authentic citations 
              from original research papers at appropriate locations.
            </div>
          )}
          
          {/* Toggle for Deep Research mode */}
          <div className="flex items-center mt-4 pt-4 border-t border-gray-200">
            <input
              type="checkbox"
              id="deep-research"
              className="w-5 h-5 text-accent focus:ring-accent rounded"
              checked={useDeepResearch}
              onChange={(e) => setUseDeepResearch(e.target.checked)}
              disabled={preserveOriginalText} // Can't use both modes at once
            />
            <label 
              htmlFor="deep-research" 
              className={`ml-2 font-medium ${preserveOriginalText ? 'text-gray-400' : ''}`}
            >
              Use Deep Research mode
            </label>
            {useDeepResearch && !preserveOriginalText && (
              <div className="flex items-center ml-4">
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-md">
                  Using Perplexity sonar-deep-research
                </span>
              </div>
            )}
          </div>
          
          {useDeepResearch && !preserveOriginalText && (
            <div className="mt-2 text-sm text-gray-600 pl-7">
              This mode performs in-depth research with comprehensive academic sources.
              Note: Deep research may take longer to process.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
