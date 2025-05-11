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

  // Format citations in a simplified style as requested by user
  const formatCitation = (citation: Citation, index: number) => {
    // Extract year from the text if available
    const yearMatch = citation.text.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    
    // Extract title if available (using a pattern matching approach)
    let title = "";
    const titleMatch = citation.text.match(/\)\.\s([^\.]+)\./);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      // Default title based on domain
      if (citation.url) {
        if (citation.url.includes("pubmed") || citation.url.includes("nih")) {
          title = "Research article on organoid analysis";
        } else if (citation.url.includes("nature")) {
          title = "Nature publication on organoids";
        } else {
          title = "Research publication";
        }
      } else {
        title = "Research publication";
      }
    }
    
    // Clean up author information
    const cleanAuthors = citation.authors
      .replace(/Not fully specified in search results/g, "Research Team")
      .replace(/Not fully specified/g, "Research Team")
      .replace(/Not specified/g, "Research Team")
      .replace(/not available/i, "Research Team")
      .replace(/undefined/g, "")
      .replace(/null/g, "")
      .trim();
    
    return (
      <li key={index} className="citation mb-6 pb-3 border-b border-gray-200 pl-8 -indent-6">
        {/* Title as main focus */}
        <div className="font-medium text-base">
          {citation.url ? (
            <a 
              href={citation.url} 
              target="_blank"
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
            >
              {title}
            </a>
          ) : (
            <span>{title}</span>
          )}
        </div>
        
        {/* Author and year in simplified format */}
        <div className="text-sm text-gray-600 mt-1">
          {cleanAuthors} ({year})
        </div>
      </li>
    );
  };

  // Filter and deduplicate citations based on title and content
  const getUniqueReferences = (cits: Citation[]): Citation[] => {
    // Extract titles from citation text for deduplication
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();
    
    return cits.filter((citation: Citation, index: number) => {
      // Clean and extract title from text
      const cleanText = citation.text || "";
      const titleMatch = cleanText.match(/\)\.\s([^\.]+)/);
      const title = titleMatch ? titleMatch[1].trim().toLowerCase() : `citation-${index}`;
      const url = citation.url ? citation.url.toLowerCase() : `url-${index}`;
      
      // Skip duplicates based on title or URL
      if (seenTitles.has(title) || seenUrls.has(url)) {
        return false;
      }
      
      // Add this title and URL to seen sets
      seenTitles.add(title);
      seenUrls.add(url);
      return true;
    });
  };

  // Get unique citations
  const uniqueCitations = getUniqueReferences(citations);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-xl font-bold mb-4">References ({uniqueCitations.length})</h3>
      <ol className="list-decimal pl-12 space-y-2 ml-2">
        {uniqueCitations.map((citation: Citation, index: number) => {
          // Filter out any "Not fully specified" citations
          if (citation.authors && citation.authors.includes("Not fully specified")) {
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
