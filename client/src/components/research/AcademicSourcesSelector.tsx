import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface SourceDomain {
  id: string;
  name: string;
  category: 'journal' | 'preprint' | 'database' | 'custom';
}

interface AcademicSourcesSelectorProps {
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
}

// Academic sources organized by category
const ACADEMIC_SOURCES: SourceDomain[] = [
  // Major Journal Publishers
  { id: 'sciencedirect.com', name: 'Science Direct (Elsevier)', category: 'journal' },
  { id: 'springer.com', name: 'Springer', category: 'journal' },
  { id: 'nature.com', name: 'Nature', category: 'journal' },
  { id: 'wiley.com', name: 'Wiley Online Library', category: 'journal' },
  { id: 'tandfonline.com', name: 'Taylor & Francis Online', category: 'journal' },
  { id: 'science.org', name: 'Science', category: 'journal' },
  { id: 'cell.com', name: 'Cell Press', category: 'journal' },
  { id: 'bmj.com', name: 'The BMJ', category: 'journal' },
  { id: 'oup.com', name: 'Oxford University Press', category: 'journal' },
  { id: 'pnas.org', name: 'PNAS', category: 'journal' },
  { id: 'sagepub.com', name: 'SAGE Publications', category: 'journal' },
  { id: 'ieee.org', name: 'IEEE', category: 'journal' },
  { id: 'acm.org', name: 'ACM Digital Library', category: 'journal' },
  { id: 'acs.org', name: 'American Chemical Society', category: 'journal' },
  { id: 'nejm.org', name: 'The New England Journal of Medicine', category: 'journal' },
  { id: 'jama.com', name: 'JAMA Network', category: 'journal' },
  { id: 'aps.org', name: 'American Physical Society', category: 'journal' },
  
  // Preprint Servers
  { id: 'arxiv.org', name: 'arXiv', category: 'preprint' },
  { id: 'biorxiv.org', name: 'bioRxiv', category: 'preprint' },
  { id: 'medrxiv.org', name: 'medRxiv', category: 'preprint' },
  { id: 'chemrxiv.org', name: 'chemRxiv', category: 'preprint' },
  { id: 'psyarxiv.com', name: 'PsyArXiv', category: 'preprint' },
  { id: 'ssrn.com', name: 'SSRN', category: 'preprint' },
  { id: 'preprints.org', name: 'Preprints.org', category: 'preprint' },
  { id: 'osf.io', name: 'OSF Preprints', category: 'preprint' },
  { id: 'techrxiv.org', name: 'TechRxiv', category: 'preprint' },
  
  // Academic Databases
  { id: 'pubmed.ncbi.nlm.nih.gov', name: 'PubMed', category: 'database' },
  { id: 'ncbi.nlm.nih.gov', name: 'NCBI', category: 'database' },
  { id: 'scholar.google.com', name: 'Google Scholar', category: 'database' },
  { id: 'webofscience.com', name: 'Web of Science', category: 'database' },
  { id: 'scopus.com', name: 'Scopus', category: 'database' },
  { id: 'semanticscholar.org', name: 'Semantic Scholar', category: 'database' },
  { id: 'jstor.org', name: 'JSTOR', category: 'database' },
  { id: 'eric.ed.gov', name: 'ERIC', category: 'database' },
  { id: 'cochranelibrary.com', name: 'Cochrane Library', category: 'database' },
  { id: 'clinicaltrials.gov', name: 'ClinicalTrials.gov', category: 'database' },
  { id: 'worldcat.org', name: 'WorldCat', category: 'database' },
  { id: 'doaj.org', name: 'Directory of Open Access Journals', category: 'database' },
  { id: 'base-search.net', name: 'BASE (Bielefeld Academic Search Engine)', category: 'database' },
  { id: 'dimensions.ai', name: 'Dimensions', category: 'database' },
  { id: 'lens.org', name: 'The Lens', category: 'database' },
];

export default function AcademicSourcesSelector({ 
  selectedSources, 
  onSourcesChange 
}: AcademicSourcesSelectorProps) {
  const [customSource, setCustomSource] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter sources based on category and search term
  const filteredSources = ACADEMIC_SOURCES.filter(source => {
    const matchesCategory = selectedCategory === 'all' || source.category === selectedCategory;
    const matchesSearch = 
      searchTerm === "" || 
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Group sources by category for display
  const sourcesByCategory = {
    journal: filteredSources.filter(s => s.category === 'journal'),
    preprint: filteredSources.filter(s => s.category === 'preprint'),
    database: filteredSources.filter(s => s.category === 'database')
  };
  
  // Handle custom source addition
  const handleAddCustomSource = () => {
    if (customSource && !selectedSources.includes(customSource)) {
      onSourcesChange([...selectedSources, customSource]);
      setCustomSource("");
    }
  };
  
  // Handle source selection toggle
  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSourcesChange(selectedSources.filter(id => id !== sourceId));
    } else {
      onSourcesChange([...selectedSources, sourceId]);
    }
  };
  
  // Remove a selected source
  const removeSource = (sourceId: string) => {
    onSourcesChange(selectedSources.filter(id => id !== sourceId));
  };
  
  // Get name of a source by ID
  const getSourceName = (sourceId: string) => {
    const source = ACADEMIC_SOURCES.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };
  
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">Academic Sources Filter</Label>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Configure Sources
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Select Academic Sources</DialogTitle>
              <DialogDescription>
                Choose which academic sources to prioritize in your research. 
                You can also add custom domains.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Search sources..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  
                  <Select 
                    defaultValue="all" 
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="journal">Journals</SelectItem>
                      <SelectItem value="preprint">Preprints</SelectItem>
                      <SelectItem value="database">Databases</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  {selectedCategory === 'all' && (
                    <>
                      <h3 className="font-medium mb-2">Journals</h3>
                      <div className="space-y-2 mb-4">
                        {sourcesByCategory.journal.map(source => (
                          <div key={source.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={source.id} 
                              checked={selectedSources.includes(source.id)}
                              onCheckedChange={() => toggleSource(source.id)}
                            />
                            <Label htmlFor={source.id} className="cursor-pointer text-sm">
                              {source.name}
                              <span className="text-xs text-gray-500 ml-1">
                                ({source.id})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      <h3 className="font-medium mb-2">Preprint Servers</h3>
                      <div className="space-y-2 mb-4">
                        {sourcesByCategory.preprint.map(source => (
                          <div key={source.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={source.id} 
                              checked={selectedSources.includes(source.id)}
                              onCheckedChange={() => toggleSource(source.id)}
                            />
                            <Label htmlFor={source.id} className="cursor-pointer text-sm">
                              {source.name}
                              <span className="text-xs text-gray-500 ml-1">
                                ({source.id})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      <h3 className="font-medium mb-2">Academic Databases</h3>
                      <div className="space-y-2">
                        {sourcesByCategory.database.map(source => (
                          <div key={source.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={source.id} 
                              checked={selectedSources.includes(source.id)}
                              onCheckedChange={() => toggleSource(source.id)}
                            />
                            <Label htmlFor={source.id} className="cursor-pointer text-sm">
                              {source.name}
                              <span className="text-xs text-gray-500 ml-1">
                                ({source.id})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {selectedCategory !== 'all' && (
                    <div className="space-y-2">
                      {filteredSources.map(source => (
                        <div key={source.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={source.id} 
                            checked={selectedSources.includes(source.id)}
                            onCheckedChange={() => toggleSource(source.id)}
                          />
                          <Label htmlFor={source.id} className="cursor-pointer text-sm">
                            {source.name}
                            <span className="text-xs text-gray-500 ml-1">
                              ({source.id})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              <div className="w-1/3">
                <h3 className="font-medium mb-2">Add Custom Source</h3>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g., university.edu" 
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                  />
                  <Button onClick={handleAddCustomSource} size="sm">Add</Button>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Selected Sources ({selectedSources.length})</h3>
                  <ScrollArea className="h-[220px] border rounded-md p-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedSources.map(sourceId => (
                        <Badge key={sourceId} variant="secondary" className="flex items-center gap-1">
                          {getSourceName(sourceId)}
                          <button 
                            onClick={() => removeSource(sourceId)}
                            className="ml-1 rounded-full hover:bg-gray-200 p-1"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                      {selectedSources.length === 0 && (
                        <p className="text-sm text-gray-500 p-2">
                          No sources selected. If none are specified, all sources will be searched.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">
                  Apply Sources
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Display selected sources */}
      <div className="flex flex-wrap gap-2 mt-1">
        {selectedSources.length > 0 ? (
          selectedSources.slice(0, 5).map(sourceId => (
            <Badge key={sourceId} variant="outline" className="text-xs">
              {getSourceName(sourceId)}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-gray-500">All sources (no filters applied)</span>
        )}
        {selectedSources.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{selectedSources.length - 5} more
          </Badge>
        )}
      </div>
    </div>
  );
}