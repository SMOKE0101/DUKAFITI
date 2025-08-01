import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Lightbulb, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchTipsProps {
  onSearchExample?: (example: string) => void;
}

const SearchTips: React.FC<SearchTipsProps> = ({ onSearchExample }) => {
  const [isOpen, setIsOpen] = useState(false);

  const searchExamples = [
    { term: 'kabras', description: 'Find Kabras Sugar products' },
    { term: 'omo', description: 'Find OMO detergent products' },
    { term: 'colgate', description: 'Find Colgate toothpaste' },
    { term: 'samsung', description: 'Find Samsung electronics' },
    { term: 'exe flour', description: 'Find Exe flour products' },
    { term: 'fresh fri', description: 'Find Fresh Fri cooking oil' },
    { term: 'coca cola', description: 'Find Coca Cola beverages' },
    { term: 'brookside', description: 'Find Brookside dairy products' }
  ];

  const searchTips = [
    'Type brand names directly: "kabras", "omo", "colgate"',
    'Search for product types: "sugar", "detergent", "toothpaste"',
    'Use partial words: "suga" will find sugar products',
    'Brand + product: "kabras sugar", "omo detergent"',
    'Categories work too: "personal care", "electronics"'
  ];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 h-auto hover:bg-primary/10"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="font-medium">Search Tips & Examples</span>
              <Badge variant="secondary" className="text-xs">
                {searchExamples.length} examples
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pb-4 px-4">
          <CardContent className="pt-0 space-y-4">
            {/* Search Examples */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Search className="w-3 h-3" />
                Try these searches:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {searchExamples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSearchExample?.(example.term)}
                    className="justify-start text-left h-auto p-2 hover:bg-primary/10"
                  >
                    <div>
                      <div className="font-medium text-xs text-primary">
                        {example.term}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {example.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Tips */}
            <div>
              <h4 className="font-medium text-sm mb-2">How to search effectively:</h4>
              <ul className="space-y-1">
                {searchTips.map((tip, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              <strong>Pro tip:</strong> Our search works like Excel - just type what you're looking for!
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SearchTips;