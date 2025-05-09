import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerateResearchRequest } from "@shared/schema";

interface ResearchFormProps {
  activeTab: "text" | "keywords";
  onSubmit: (data: GenerateResearchRequest) => void;
  isProcessing: boolean;
}

export default function ResearchForm({ activeTab, onSubmit, isProcessing }: ResearchFormProps) {
  const [textInput, setTextInput] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sourcesLimit, setSourcesLimit] = useState("10");

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
        sourcesLimit: parseInt(sourcesLimit),
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

          <div className="mb-4">
            <Label htmlFor="keywords-limit" className="block mb-2 font-medium">
              Number of sources to search
            </Label>
            <Select defaultValue={sourcesLimit} onValueChange={setSourcesLimit}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select number of sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 sources</SelectItem>
                <SelectItem value="10">10 sources</SelectItem>
                <SelectItem value="15">15 sources</SelectItem>
                <SelectItem value="20">20 sources</SelectItem>
              </SelectContent>
            </Select>
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