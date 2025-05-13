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

  // We're no longer deduplicating citations to ensure citation numbers match between text and references
  // This ensures that each [n] in the text has a corresponding entry in the references list
  const citationsToDisplay = citations;

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-xl font-bold mb-4">
        References ({citationsToDisplay.length})
      </h3>
      <ol className="list-decimal pl-16 space-y-4 mt-6">
        {citationsToDisplay.map((citation, index) => (
          <li
            key={index}
            className="citation mb-6 pb-3 border-b border-gray-200 relative"
          >
            <div className="ml-8"> 
              {/* Much more padding to completely separate number and content */}
              {citation.url ? (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                  style={{ display: 'block', paddingLeft: '1.5rem' }} /* Additional padding via inline style */
                >
                  {citation.url}
                </a>
              ) : (
                <span className="text-gray-600 block pl-6">No URL available</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
