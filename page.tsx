'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchResult {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  brand: string;
  condition: string;
  score: number;
  scoreBreakdown: string[];
  blurb: string;
}

interface SearchResponse {
  results: SearchResult[];
  summary: string;
  metadata: {
    query: string;
    totalResults: number;
    processingTime: number;
    useLLM: boolean;
    cost: string;
  };
}

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10,
          useLLM
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'black jeans under $100',
    'vintage nike sneakers',
    'luxury handbag under $500',
    'cotton t-shirt not polyester',
    'hermes bracelet blue leather'
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cost-Effective Fashion Search Test</CardTitle>
          <p className="text-gray-600">
            Test the new cost-effective search system with regex/lexicon parsing and minimal LLM usage.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="flex gap-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., black jeans under $100, vintage nike sneakers..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* LLM Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useLLM"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
            />
            <label htmlFor="useLLM" className="text-sm">
              Use LLM for summaries (increases cost)
            </label>
          </div>

          {/* Example Queries */}
          <div>
            <h3 className="font-semibold mb-2">Try these examples:</h3>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{results.summary}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Processing time: {results.metadata.processingTime}ms</p>
                    <p>Cost: {results.metadata.cost}</p>
                    <p>LLM used: {results.metadata.useLLM ? 'Yes' : 'No'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Results List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Results ({results.metadata.totalResults})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.results.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-gray-600">{item.brand}</p>
                            <p className="text-sm text-gray-500">{item.condition}</p>
                            <p className="text-sm">{item.blurb}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{item.price}</p>
                            <p className="text-sm text-gray-600">Score: {item.score.toFixed(2)}</p>
                          </div>
                        </div>
                        {item.scoreBreakdown.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Score factors:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.scoreBreakdown.map((factor, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                >
                                  {factor}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

