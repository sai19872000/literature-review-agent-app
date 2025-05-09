import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateResearchSummary } from "./services/perplexity";
import { enhanceTextWithCitations } from "./services/citation-agent";
import { processDeepResearch } from "./services/deep-research-agent";
import { fromZodError } from "zod-validation-error";
import { generateResearchSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint for Perplexity API
  app.get("/api/v1/test-perplexity", async (req, res) => {
    try {
      console.log("Testing Perplexity API...");
      const testPrompt = "Explain what organoids are in 2-3 paragraphs with citations";
      const summary = await generateResearchSummary(testPrompt);
      res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error("Error testing Perplexity API:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to test Perplexity API",
        error: error instanceof Error ? error.toString() : "Unknown error"
      });
    }
  });
  
  // Test endpoint for Perplexity Deep Research API
  app.get("/api/v1/test-deep-research", async (req, res) => {
    try {
      console.log("Testing Perplexity Deep Research API mode...");
      const testPrompt = "Explain what quantum computing is and its latest advancements in 3 paragraphs with citations";
      
      // For debugging - display all information about the module and its models
      console.log("Perplexity API available models:");
      console.log("- llama-3.1-sonar-small-128k-online");
      console.log("- llama-3.1-sonar-large-128k-online");
      console.log("- llama-3.1-sonar-huge-128k-online");
      console.log("- sonar-deep-research (if available)");
      
      // Create options object with explicit string "true" to test conversion
      const options = {
        useDeepResearch: "true",
        maxTokens: 800
      };
      
      console.log("Options before calling API:", JSON.stringify(options, null, 2));
      
      // Explicitly set useDeepResearch to true string to test the conversion
      const summary = await generateResearchSummary(testPrompt, options);
      
      res.json({
        success: true,
        summary,
        usedDeepResearch: true,
        requestedModel: "sonar-deep-research",
        actualModelUsed: summary.modelUsed || "unknown"
      });
    } catch (error) {
      console.error("Error testing Perplexity Deep Research API:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to test Perplexity Deep Research API",
        error: error instanceof Error ? error.toString() : "Unknown error"
      });
    }
  });

  // PDF endpoint removed in UI redesign

  // API endpoint for generating research summary from text
  app.post("/api/research/text", async (req, res) => {
    try {
      try {
        // Create a dedicated text schema since we can't use pick() on a discriminated union
        const textSchema = z.object({
          text: z.string().min(10, "Text must be at least 10 characters long"),
          useDeepResearch: z.union([z.boolean(), z.string()]).optional(), // Accept boolean or string value
          maxTokens: z.number().int().positive().optional(),
        });
        textSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { text, useDeepResearch, maxTokens } = req.body;
      
      // Generate research summary using Perplexity API
      const summary = await generateResearchSummary(text, {
        useDeepResearch,
        maxTokens
      });
      
      // Store the research summary in memory storage
      const savedSummary = await storage.saveResearchSummary(summary);
      
      res.json(savedSummary);
    } catch (error) {
      console.error("Error processing text:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process text" 
      });
    }
  });

  // API endpoint for generating research summary from keywords
  app.post("/api/research/keywords", async (req, res) => {
    try {
      try {
        // Since we can't use pick on a discriminated union, validate using the keywords schema directly
        const keywordsSchema = z.object({
          keywords: z.string().min(3, "Keywords must be at least 3 characters long"),
          sourcesLimit: z.number().int().min(1).max(20).default(10),
          useDeepResearch: z.union([z.boolean(), z.string()]).optional(), // Accept boolean or string value
          maxTokens: z.number().int().positive().optional(),
        });
        keywordsSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { keywords, sourcesLimit = 5, useDeepResearch, maxTokens } = req.body;
      
      console.log(`Generating research on keywords: "${keywords}" with ${sourcesLimit} sources`);
      if (useDeepResearch) {
        console.log("Using deep research mode with max tokens:", maxTokens || "default");
      }
      
      // Generate research summary using Perplexity API
      const summary = await generateResearchSummary(
        `Provide a comprehensive literature review on the following topics: ${keywords}. 
        Include up to ${sourcesLimit} academic sources.`,
        {
          useDeepResearch,
          maxTokens
        }
      );
      
      // Store the research summary in memory storage
      const savedSummary = await storage.saveResearchSummary(summary);
      
      res.json(savedSummary);
    } catch (error) {
      console.error("Error processing keywords:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process keywords" 
      });
    }
  });

  // API endpoint for agentic deep research (Claude + Perplexity flow)
  app.post("/api/research/agentic-deep", async (req, res) => {
    try {
      // Validate the request body
      const deepResearchSchema = z.object({
        text: z.string().min(3, "Topic must be at least 3 characters long"),
      });
      
      try {
        deepResearchSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { text } = req.body;
      
      console.log(`Starting agentic deep research on topic: "${text}"`);
      
      // Process the deep research request using our agentic flow
      const researchSummary = await processDeepResearch(text);
      
      // Store the research summary in memory storage
      const savedSummary = await storage.saveResearchSummary(researchSummary);
      
      res.json(savedSummary);
    } catch (error) {
      console.error("Error processing agentic deep research:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process agentic deep research" 
      });
    }
  });

  // API endpoint for enhancing text with original citations
  app.post("/api/enhance-text", async (req, res) => {
    try {
      // Validate the request body
      const enhanceTextSchema = z.object({
        text: z.string().min(10, "Text must be at least 10 characters long"),
      });
      
      try {
        enhanceTextSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { text } = req.body;
      
      console.log(`Enhancing text with citations, text length: ${text.length} characters`);
      
      // Process the text to add citations using our agentic flow
      const enhancedTextResponse = await enhanceTextWithCitations(text);
      
      res.json(enhancedTextResponse);
    } catch (error) {
      console.error("Error enhancing text with citations:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to enhance text with citations" 
      });
    }
  });

  // Unified API endpoint for research generation
  app.post("/api/research/generate", async (req, res) => {
    try {
      // Parse and validate the request using the unified schema
      let validatedData;
      try {
        validatedData = generateResearchSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      console.log(`Processing research request of type: ${validatedData.type}`);
      
      // Extract common options
      const useDeepResearch = 
        req.body.isDeepResearch === true || 
        req.body.isDeepResearch === "true";
      
      const maxTokens = req.body.maxTokens ? parseInt(req.body.maxTokens) : undefined;
      
      // Process based on research type
      let summary;
      
      switch (validatedData.type) {
        case "text": {
          // Generate research from text input
          summary = await generateResearchSummary(validatedData.text, {
            useDeepResearch,
            maxTokens
          });
          break;
        }
        
        case "keywords": {
          // Generate research from keywords
          const promptText = `Provide a comprehensive literature review on the following topics: ${validatedData.keywords}. 
            Include up to ${validatedData.sourcesLimit || 10} academic sources.`;
          
          summary = await generateResearchSummary(promptText, {
            useDeepResearch,
            maxTokens
          });
          break;
        }
        
        default:
          return res.status(400).json({ message: "Invalid research type" });
      }
      
      // Store the research summary in memory storage
      const savedSummary = await storage.saveResearchSummary(summary);
      
      res.json(savedSummary);
    } catch (error) {
      console.error("Error generating research:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate research" 
      });
    }
  });

  // Simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Research Assistant WebSocket Server',
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Echo back for testing
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            message: 'Pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
  });
  
  // Export a function to broadcast messages to all connected clients
  (global as any).broadcastResearchProgress = (data: any) => {
    const message = JSON.stringify({
      type: 'research_progress',
      data,
      timestamp: new Date().toISOString()
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  return httpServer;
}
