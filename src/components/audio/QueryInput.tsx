
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Search, Loader2 } from 'lucide-react';

interface QueryInputProps {
  textQuery: string;
  onQueryChange: (query: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  processingProgress: number;
}

const QueryInput = ({
  textQuery,
  onQueryChange,
  onProcess,
  isProcessing,
  processingProgress
}: QueryInputProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="textQuery">Natural Language Query</Label>
        <Textarea
          id="textQuery"
          placeholder="e.g., 'extract the speech', 'separate dog barking', 'get the music without vocals', etc."
          value={textQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          rows={3}
        />
        <p className="text-sm text-gray-500 mt-1">
          Tip: Be specific about what you want to extract. You can combine multiple requests with commas.
        </p>
      </div>

      <Button 
        onClick={onProcess}
        disabled={!textQuery.trim() || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Extract Audio
          </>
        )}
      </Button>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing Audio</span>
            <span>{processingProgress}%</span>
          </div>
          <Progress value={processingProgress} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default QueryInput;
