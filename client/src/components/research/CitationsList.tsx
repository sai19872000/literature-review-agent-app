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
    <div className="space-y-4">
      {citations.map((citation, index) => (
        <p key={index} className="citation">
          {citation.url ? (
            <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {citation.authors}
            </a>
          ) : (
            <span>{citation.authors}</span>
          )}
          {citation.text}
        </p>
      ))}
    </div>
  );
}
