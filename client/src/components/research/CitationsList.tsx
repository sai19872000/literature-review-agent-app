import { Citation } from "@shared/schema";

interface CitationsListProps {
  citations: Citation[];
}

export default function CitationsList({ citations }: CitationsListProps) {
  if (!citations || citations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No citations available</p>
      </div>
    );
  }

  // Format citations to ensure they follow a consistent academic style
  const formatCitation = (citation: Citation, index: number) => {
    // Extract year from the text if available
    const yearMatch = citation.text.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : "n.d.";
    
    // Clean up the text by removing any "undefined" or "null" values
    const cleanText = citation.text
      .replace(/undefined/g, "")
      .replace(/null/g, "")
      .replace("(n.d.)", `(${year})`);
    
    return (
      <li key={index} className="citation py-1 mb-4">
        <div className="flex flex-col">
          {/* Citation in academic format */}
          <div className="font-medium">
            {citation.url ? (
              <a 
                href={citation.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                {citation.authors}
              </a>
            ) : (
              <span>{citation.authors}</span>
            )}
          </div>
          
          {/* Citation text with consistent formatting */}
          <div className="text-sm mt-1 text-gray-700 leading-relaxed">
            {cleanText}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-xl font-bold mb-4">References</h3>
      <ol className="list-decimal pl-5 space-y-1">
        {citations.map((citation, index) => formatCitation(citation, index))}
      </ol>
    </div>
  );
}
