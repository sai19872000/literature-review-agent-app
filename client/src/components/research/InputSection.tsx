import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ResearchForm from "./ResearchForm";
import ResearchProgress from "./ResearchProgress";
import { ResearchSummary, GenerateResearchRequest } from "@shared/schema";
import { generateResearch, enhanceTextWithCitations, performAgenticDeepResearch } from "@/lib/api";
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
  // Research mode: "standard" (regular), "preserve" (preserve original text), or "deep" (deep research)
  const [researchMode, setResearchMode] = useState<"standard" | "preserve" | "deep">("standard");
  // Tracking if we're using deep research for the loading state
  const [isUsingDeepResearch, setIsUsingDeepResearch] = useState<boolean>(false);
  // Research progress tracking
  const [progressEvents, setProgressEvents] = useState<any[]>([]);
  const [showProgress, setShowProgress] = useState<boolean>(false);

  // Auto-select deep research mode for keywords
  useEffect(() => {
    if (activeTab === "keywords") {
      setResearchMode("deep");
    }
  }, [activeTab]);

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
      // Update deep research mode state
      const isDeepResearch = researchMode === "deep";
      setIsUsingDeepResearch(isDeepResearch);
      
      // Reset progress state for new request
      setProgressEvents([]);
      setShowProgress(isDeepResearch); // Only show for deep research mode
      
      // Tell parent component we're starting, with deep research flag if needed
      onGenerationStart({ isDeepResearch });
      
      // If text input mode is selected and preserve original text mode is enabled
      if (researchMode === "preserve" && formData.type === "text") {
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
      } else if (researchMode === "deep" || activeTab === "keywords") {
        // Use our agentic deep research flow with Claude + Perplexity
        // Always use deep research for keywords
        let inputText = "";
        
        // Extract the appropriate text based on form data type
        if (formData.type === "text") {
          inputText = formData.text;
        } else if (formData.type === "keywords") {
          inputText = formData.keywords;
        }
        
        if (!inputText || inputText.trim().length === 0) {
          throw new Error("No input text provided for deep research");
        }
        
        console.log("Starting agentic deep research flow with input:", inputText.substring(0, 100) + "...");
        
        // Call the agentic deep research API
        const result = await performAgenticDeepResearch(inputText);
        onGenerationComplete(result);
      } else {
        // Standard research mode without deep research
        const result = await generateResearch(formData);
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
          
          {/* Research Mode Selection (Radio Buttons) */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-medium mb-3">Research Mode</h4>
            
            <RadioGroup 
              value={researchMode} 
              onValueChange={(value) => setResearchMode(value as "standard" | "preserve" | "deep")}
              className="space-y-3"
              disabled={activeTab === "keywords"} // Always use deep research for keywords
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="standard" 
                  id="research-standard" 
                  disabled={activeTab === "keywords"}
                />
                <Label htmlFor="research-standard">
                  Standard Research
                </Label>
              </div>
              
              {activeTab === "text" && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="preserve" 
                    id="research-preserve"
                  />
                  <Label htmlFor="research-preserve" className="flex items-center">
                    Preserve Original Text
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md ml-2">
                      Using Claude 3.7 + Perplexity agent
                    </span>
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="deep" 
                  id="research-deep"
                />
                <Label htmlFor="research-deep" className="flex items-center">
                  Deep Research
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-md ml-2">
                    Using Perplexity sonar-deep-research
                  </span>
                </Label>
              </div>
            </RadioGroup>
            
            {researchMode === "preserve" && (
              <div className="mt-2 text-sm text-gray-600 pl-7">
                This mode will preserve your original text and add authentic citations 
                from original research papers at appropriate locations.
              </div>
            )}
            
            {(researchMode === "deep" || activeTab === "keywords") && (
              <div className="mt-2 text-sm text-gray-600 pl-7">
                This mode performs in-depth research with comprehensive academic sources.
                Note: Deep research may take longer to process.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}