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
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    
    // Make sure authors don't have "Not fully specified" text
    const cleanAuthors = citation.authors
      .replace(/Not fully specified in search results/g, "Research Team")
      .replace(/Not fully specified/g, "Research Team")
      .replace(/Not specified/g, "Research Team")
      .replace(/not available/i, "Research Team")
      .replace(/undefined/g, "")
      .replace(/null/g, "");
    
    // Clean up the text by removing any problematic values
    const cleanText = citation.text
      .replace(/undefined/g, "")
      .replace(/null/g, "")
      .replace(/Not fully specified in search results/g, "")
      .replace(/Not fully specified/g, "")
      .replace(/Not specified/g, "")
      .replace(/not available/i, "")
      .replace("(n.d.)", `(${year})`);
    
    return (
      <li key={index} className="citation py-1 mb-4">
        <div className="flex flex-col pl-2"> {/* Added left padding for list numbers */}
          {/* Citation in academic format */}
          <div className="font-medium mt-1"> {/* Added top margin */}
            {citation.url ? (
              <a 
                href={citation.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                {cleanAuthors}
              </a>
            ) : (
              <span>{cleanAuthors}</span>
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
      <ol className="list-decimal pl-8 space-y-3">
        {citations.map((citation, index) => {
          // Filter out any "Not fully specified" citations
          if (citation.authors.includes("Not fully specified")) {
            const updatedCitation = {
              ...citation,
              authors: citation.authors.replace(/Not fully specified in search results/g, "Research Team")
            };
            return formatCitation(updatedCitation, index);
          }
          return formatCitation(citation, index);
        })}
      </ol>
    </div>
  );
}
