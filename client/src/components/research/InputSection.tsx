import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ResearchForm from "./ResearchForm";
import { ResearchSummary, GenerateResearchRequest } from "@shared/schema";
import { generateResearch } from "@/lib/api";
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

  const handleSubmit = async (formData: GenerateResearchRequest) => {
    try {
      onGenerationStart();
      const result = await generateResearch(formData);
      onGenerationComplete(result);
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

          <div className="flex items-center">
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
        </CardContent>
      </Card>
    </section>
  );
}
