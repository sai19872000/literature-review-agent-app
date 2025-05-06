import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { generateResearchSummary } from "./services/perplexity";
import { extractTextFromPDF } from "./services/pdf-extractor";
import { enhanceTextWithCitations } from "./services/citation-agent";
import { fromZodError } from "zod-validation-error";
import { generateResearchSchema } from "@shared/schema";
import { z, ZodError } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

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

  // API endpoint for generating research summary from PDF
  app.post("/api/research/pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      // Extract text from PDF
      const pdfText = await extractTextFromPDF(req.file.buffer);
      
      if (!pdfText || pdfText.trim().length === 0) {
        return res.status(400).json({ message: "Could not extract text from PDF" });
      }
      
      // Check if deep research mode is requested
      const useDeepResearch = req.body.useDeepResearch === "true";
      const maxTokens = req.body.maxTokens ? parseInt(req.body.maxTokens) : undefined;
      
      if (useDeepResearch) {
        console.log("Using deep research mode for PDF with max tokens:", maxTokens || "default");
      }

      // Generate research summary using Perplexity API
      const summary = await generateResearchSummary(pdfText, {
        useDeepResearch,
        maxTokens
      });
      
      // Store the research summary in memory storage
      const savedSummary = await storage.saveResearchSummary(summary);
      
      res.json(savedSummary);
    } catch (error) {
      console.error("Error processing PDF:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process PDF" 
      });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
