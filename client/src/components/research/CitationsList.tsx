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

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-xl font-bold mb-4">References</h3>
      <ol className="list-decimal pl-5 space-y-3">
        {citations.map((citation, index) => (
          <li key={index} className="citation py-1">
            <div className="flex flex-col">
              {/* Citation authors with optional link */}
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
              
              {/* Citation text */}
              <div className="text-sm mt-1 text-gray-600">
                {citation.text}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
