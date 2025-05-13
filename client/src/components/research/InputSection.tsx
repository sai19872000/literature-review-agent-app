import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ResearchForm from "./ResearchForm";
import ResearchProgress from "./ResearchProgress";
import AcademicSourcesSelector from "./AcademicSourcesSelector";
import { ResearchSummary, GenerateResearchRequest } from "@shared/schema";
import { enhanceTextWithCitations, performAgenticDeepResearch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InputSectionProps {
  onGenerationStart: (options?: { isDeepResearch?: boolean }) => void;
  onGenerationComplete: (data: ResearchSummary) => void;
  isProcessing: boolean;
}

export default function InputSection({ 
  onGenerationStart, 
  onGenerationComplete,
  isProcessing
}: InputSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"text" | "keywords">("text");
  // Text mode is always "preserve" and keywords mode is always "deep"
  // Tracking if we're using deep research for the loading state
  const [isUsingDeepResearch, setIsUsingDeepResearch] = useState<boolean>(false);
  // Research progress tracking
  const [progressEvents, setProgressEvents] = useState<any[]>([]);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  // Academic sources filter
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // No longer need to auto-select modes as they're fixed per tab

  // Handle WebSocket progress updates
  const handleProgressUpdate = (event: any) => {
    console.log('Progress update received:', event);
    setProgressEvents(prev => [...prev, event]);
    
    // Show the progress component when we start getting updates
    if (!showProgress) {
      setShowProgress(true);
    }
    
    // Hide the progress component when we're complete
    if (event.stage === 'complete' || event.stage === 'error') {
      // Keep the progress visible for a short time after completion
      setTimeout(() => {
        setShowProgress(false);
        setProgressEvents([]);
      }, 3000);
    }
  };
  
  const handleSubmit = async (formData: GenerateResearchRequest) => {
    try {
      // Determine mode based on tab - text=preserve, keywords=deep
      const isDeepResearch = activeTab === "keywords";
      setIsUsingDeepResearch(isDeepResearch);
      
      // Reset progress state for new request
      setProgressEvents([]);
      setShowProgress(isDeepResearch); // Only show progress for deep research mode
      
      // Tell parent component we're starting, with deep research flag if needed
      onGenerationStart({ isDeepResearch });
      
      // Text input mode always uses preserve original text
      if (activeTab === "text" && formData.type === "text") {
        // Include the selected academic sources in the API call
        const enhancedResult = await enhanceTextWithCitations(
          formData.text, 
          selectedSources.length > 0 ? { searchDomains: selectedSources } : undefined
        );
        
        // Convert the enhanced text response to a research summary format
        const result: ResearchSummary = {
          title: "Enhanced Original Text with Citations",
          content: enhancedResult.enhancedText,
          citations: enhancedResult.citations,
          modelUsed: "claude-3.7-sonnet-20250219" // Always Claude for enhanced text
        };
        
        onGenerationComplete(result);
      } 
      // Keywords input mode always uses deep research
      else if (activeTab === "keywords") {
        // Use our agentic deep research flow with Claude + Perplexity
        let inputText = "";
        
        // Extract the appropriate text based on form data type
        if (formData.type === "keywords") {
          inputText = formData.keywords;
        }
        
        if (!inputText || inputText.trim().length === 0) {
          throw new Error("No input text provided for deep research");
        }
        
        console.log("Starting agentic deep research flow with input:", inputText.substring(0, 100) + "...");
        
        // Call the agentic deep research API with selected sources
        const result = await performAgenticDeepResearch(
          inputText,
          selectedSources.length > 0 ? { searchDomains: selectedSources } : undefined
        );
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
      {/* Show the progress component when needed */}
      {showProgress && isProcessing && isUsingDeepResearch && (
        <ResearchProgress onProgressUpdate={handleProgressUpdate} />
      )}
    
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 pb-2 border-b border-gray-200">
            Research Input
          </h3>
          
          {/* Academic Sources Selector - appears at the top for both tabs */}
          <AcademicSourcesSelector
            selectedSources={selectedSources}
            onSourcesChange={setSelectedSources}
          />

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
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

          {/* Citation style selector removed - using simplified citation format */}

          {/* Summary Length selector removed - agents always generate comprehensive reports */}

          {/* Hidden default options that are always enabled */}
          <input
            type="hidden"
            id="include-quotes"
            defaultValue="true"
          />
          <input
            type="hidden"
            id="organize-themes"
            defaultValue="true"
          />
          
          {/* Mode descriptions - hardcoded to specific tabs */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-medium mb-3">Mode Information</h4>
            
            {activeTab === "text" && (
              <div className="p-4 bg-blue-50 rounded-md">
                <h5 className="font-medium flex items-center text-blue-700">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md mr-2">
                    Text Mode
                  </span>
                  Preserve Original Text
                </h5>
                <p className="mt-2 text-sm text-gray-600">
                  This mode will preserve your original text and add authentic citations 
                  from original research papers at appropriate locations.
                  <br /><br />
                  <span className="italic">Using Claude 3.7 + Perplexity agent</span>
                </p>
              </div>
            )}
            
            {activeTab === "keywords" && (
              <div className="p-4 bg-purple-50 rounded-md">
                <h5 className="font-medium flex items-center text-purple-700">
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-md mr-2">
                    Keywords Mode
                  </span>
                  Deep Research
                </h5>
                <p className="mt-2 text-sm text-gray-600">
                  Creates comprehensive research summaries with deep academic insights.
                  Uses our combined Claude + Perplexity agentic workflow.
                  <br /><br />
                  <span className="italic">Using Perplexity sonar-deep-research</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}