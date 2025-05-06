import { useState } from "react";
import InputSection from "@/components/research/InputSection";
import OutputSection from "@/components/research/OutputSection";
import { ResearchSummary } from "@shared/schema";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [researchSummary, setResearchSummary] = useState<ResearchSummary | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-10 text-center max-w-3xl mx-auto">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4">
          Generate Comprehensive Research Summaries
        </h2>
        <p className="text-lg text-secondary">
          Upload research papers, enter text, or search keywords to create professional literature
          reviews and citations powered by the Perplexity Sonar AI API.
        </p>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <InputSection 
          onGenerationStart={() => setIsProcessing(true)}
          onGenerationComplete={(data) => {
            setResearchSummary(data);
            setIsProcessing(false);
          }}
          isProcessing={isProcessing}
        />
        <OutputSection 
          isProcessing={isProcessing} 
          researchSummary={researchSummary}
        />
      </div>
    </div>
  );
}
