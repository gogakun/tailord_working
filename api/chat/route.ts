// Chat API endpoint for fashion advice and product recommendations
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiChat, type ChatMessage } from "@/lib/aiChat";
import { logger } from "@/lib/logger";

const ChatRequest = z.object({
  message: z.string().min(1).max(500),
  history: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string(),
    products: z.array(z.any()).optional(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    logger.ai('Chat API called', { method: req.method });
    
    const body = ChatRequest.safeParse(await req.json());
    if (!body.success) {
      logger.error('Invalid chat request', { error: body.error });
      return NextResponse.json(
        { error: "Invalid request", details: body.error },
        { status: 400 }
      );
    }

    const { message, history = [] } = body.data;
    logger.ai('Processing chat message', { message, historyLength: history.length });

    // Convert history timestamps to Date objects
    const convertedHistory = history.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    // Generate AI response with conversation history
    const advice = await aiChat.generateResponse(message, convertedHistory);
    
    // If there are search queries, fetch products for the first one
    let products: any[] = [];
    if (advice.searchQueries && advice.searchQueries.length > 0) {
      const firstQuery = advice.searchQueries[0];
      logger.search('Fetching products for advice', { query: firstQuery });
      products = await aiChat.searchProducts(firstQuery);
    }

    // Create response message
    const responseMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: advice.message,
      timestamp: new Date(),
      products: products.length > 0 ? products : undefined,
    };

    logger.ai('Chat response generated', { 
      messageId: responseMessage.id, 
      productsCount: products.length 
    });

    return NextResponse.json({
      message: responseMessage,
      searchQueries: advice.searchQueries,
      stats: {
        totalProducts: products.length,
        searchQueries: advice.searchQueries?.length || 0,
      }
    });

  } catch (error: any) {
    logger.error('Chat API error', { error: error.message });
    return NextResponse.json(
      { error: "Chat failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Fashion AI Chat API",
    endpoints: {
      POST: "Send a message and get fashion advice with product recommendations"
    },
    features: [
      "Fashion advice and styling tips",
      "Product recommendations",
      "Budget-aware suggestions",
      "Style-specific guidance",
      "Outfit coordination"
    ],
    example: {
      message: "I need a summer outfit",
      response: "Fashion advice with product recommendations"
    }
  });
}
