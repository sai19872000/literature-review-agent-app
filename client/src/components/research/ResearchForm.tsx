import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GenerateResearchRequest } from "@shared/schema";

interface ResearchFormProps {
  activeTab: "text" | "keywords";
  onSubmit: (data: GenerateResearchRequest) => void;
  isProcessing: boolean;
}

export default function ResearchForm({ activeTab, onSubmit, isProcessing }: ResearchFormProps) {
  const [textInput, setTextInput] = useState("");
  const [keywords, setKeywords] = useState("");
  // Always use maximum sources for deep research
  const MAX_SOURCES = 20; 

  const handleSubmit = () => {
    let payload: GenerateResearchRequest;

    if (activeTab === "text" && textInput.trim()) {
      payload = {
        type: "text",
        text: textInput.trim(),
      };
    } else if (activeTab === "keywords" && keywords.trim()) {
      payload = {
        type: "keywords",
        keywords: keywords.trim(),
        sourcesLimit: MAX_SOURCES, // Always use maximum sources
      };
    } else {
      // Validation error
      alert("Please provide the required input based on your selected tab");
      return;
    }

    onSubmit(payload);
  };

  return (
    <div>
      {/* Text Input Tab */}
      {activeTab === "text" && (
        <div className="mb-4">
          <Label htmlFor="text-input" className="block mb-2 font-medium">
            Enter text to enhance with citations
          </Label>
          <div className="text-sm text-gray-600 mb-2">
            Your text will be preserved exactly as written, and citations will be added where appropriate.
          </div>
          <Textarea
            id="text-input"
            rows={10}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Paste your text here to enhance with academic citations..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === "keywords" && (
        <>
          <div className="mb-4">
            <Label htmlFor="keywords-input" className="block mb-2 font-medium">
              Enter research topic or keywords
            </Label>
            <div className="text-sm text-gray-600 mb-2">
              We'll create a comprehensive research summary with deep academic insights on your topic.
            </div>
            <Textarea
              id="keywords-input"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter a research topic, question, or keywords (e.g., 'The impact of climate change on biodiversity')..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          {/* Maximum sources always used for deep research - selection removed */}
          <div className="mb-4 p-2 bg-purple-50 rounded-md text-sm text-gray-600">
            <p className="font-medium text-purple-700">Deep Research Mode</p>
            <p className="mt-1">This will generate a complete research summary with the maximum number of academic sources. The process may take 3-10 minutes.</p>
          </div>
        </>
      )}

      {/* Generate Button */}
      <Button
        id="generate-btn"
        className="w-full mt-4 bg-accent hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        onClick={handleSubmit}
        disabled={isProcessing}
      >
        <i className="fas fa-magic mr-2"></i>Generate Research Summary
      </Button>
    </div>
  );
}