// src/app/api/search/route.ts
// Local catalog search with intent parsing and ranking
import { NextRequest, NextResponse } from 'next/server';
import { enhancedSearch, deduplicateResults } from '@/lib/enhancedSearch';
import { generateLLMSummary, generateItemBlurbs } from '@/lib/summaryGenerator';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    const { query, role, limit = 20, budget, useLLM = false } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    logger.search('Search request received', { query, role, limit, budget, useLLM });

    // 1. Parse and search (synchronous, fast path)
    const results = await enhancedSearch(query, {
      limit: Math.min(limit, 50), // Cap at 50 for performance
      role,
      budget,
      useVectorSearch: false // Keep it simple for now
    });

    // 2. Deduplicate results
    const deduplicatedResults = deduplicateResults(results);

    // 3. Generate summary (cost-effective)
    let summary: string;
    let itemBlurbs: Array<{ id: string; blurb: string }> = [];

    if (useLLM) {
      // Use LLM for summary and blurbs
      summary = await generateLLMSummary(deduplicatedResults, query, true);
      itemBlurbs = await generateItemBlurbs(deduplicatedResults.slice(0, 10), query);
    } else {
      // Use simple summary (no LLM cost)
      summary = await generateLLMSummary(deduplicatedResults, query, false);
    }

    // 4. Add blurbs to results
    const blurbsMap = new Map(itemBlurbs.map(b => [b.id, b.blurb]));
    const finalResults = deduplicatedResults.map(result => ({
      ...result,
      blurb: blurbsMap.get(result.id) || `${result.brand} ${result.title} - ${result.price}`
    }));

    const processingTime = Date.now() - startTime;

    logger.search('Search completed', {
      query,
      resultsCount: finalResults.length,
      processingTime,
      useLLM
    });

    return NextResponse.json({
      results: finalResults,
      summary,
      metadata: {
        query,
        totalResults: finalResults.length,
        processingTime,
        useLLM,
        cost: useLLM ? 'low' : 'minimal' // Would track actual cost
      }
    });

  } catch (error) {
    logger.error('Search API error', { error });
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '20');
    const useLLM = searchParams.get('llm') === 'true';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Reuse POST logic by calling the search function directly
    const results = await enhancedSearch(query, {
      limit: Math.min(limit, 50),
      role: role || undefined,
      useVectorSearch: false
    });

    const deduplicatedResults = deduplicateResults(results);
    const summary = await generateLLMSummary(deduplicatedResults, query, useLLM);

    return NextResponse.json({
      results: deduplicatedResults,
      summary,
      metadata: {
        query,
        totalResults: deduplicatedResults.length,
        useLLM,
        cost: useLLM ? 'low' : 'minimal'
      }
    });

  } catch (error) {
    logger.error('Search GET API error', { error });
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
