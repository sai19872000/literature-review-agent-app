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

  // Just get unique URLs
  const getUniqueUrls = (cits: Citation[]): Citation[] => {
    const seenUrls = new Set<string>();
    
    return cits.filter((citation: Citation) => {
      if (!citation.url || seenUrls.has(citation.url)) {
        return false;
      }
      
      seenUrls.add(citation.url);
      return true;
    });
  };

  // Get unique citations by URL
  const uniqueCitations = getUniqueUrls(citations);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-xl font-bold mb-4">References ({uniqueCitations.length})</h3>
      <ol className="list-decimal pl-6 space-y-2 mt-4 ml-6">
        {uniqueCitations.map((citation, index) => (
          <li key={index} className="citation mb-4 pb-2 border-b border-gray-200">
            {citation.url ? (
              <a 
                href={citation.url} 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline break-all"
              >
                {citation.url}
              </a>
            ) : (
              <span className="text-gray-600">No URL available</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
