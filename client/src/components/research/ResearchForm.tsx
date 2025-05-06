import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerateResearchRequest } from "@shared/schema";

interface ResearchFormProps {
  activeTab: "upload" | "text" | "keywords";
  onSubmit: (data: GenerateResearchRequest) => void;
  isProcessing: boolean;
}

export default function ResearchForm({ activeTab, onSubmit, isProcessing }: ResearchFormProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sourcesLimit, setSourcesLimit] = useState("10");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setPdfFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    let payload: GenerateResearchRequest;

    if (activeTab === "upload" && pdfFile) {
      const formData = new FormData();
      formData.append("file", pdfFile);
      payload = {
        type: "pdf",
        pdfFile: pdfFile,
      };
    } else if (activeTab === "text" && textInput.trim()) {
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
      {/* Upload PDF Tab */}
      {activeTab === "upload" && (
        <div>
          <div
            className={`border-2 border-dashed ${
              pdfFile ? "border-accent bg-blue-50" : "border-gray-300"
            } rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {!pdfFile ? (
              <>
                <i className="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
                <p className="mb-2 font-medium">Drag and drop your research paper here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                <p className="text-xs text-gray-400">Supports PDF format up to 20MB</p>
              </>
            ) : (
              <div className="flex items-center">
                <i className="fas fa-file-pdf text-accent mr-3 text-xl"></i>
                <div className="flex-grow text-left">
                  <p className="font-medium">{pdfFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  className="text-gray-500 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
