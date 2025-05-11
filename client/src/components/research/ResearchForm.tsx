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
            Enter text from your research
          </Label>
          <Textarea
            id="text-input"
            rows={10}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Paste a paragraph or abstract from your research paper..."
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
              Enter research keywords
            </Label>
            <Input
              id="keywords-input"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g., climate change, neural networks, renewable energy"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          {/* Maximum sources always used for deep research - selection removed */}
          <div className="mb-4 text-sm text-gray-600 italic">
            <p>Deep research mode will automatically use all available sources for comprehensive results.</p>
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