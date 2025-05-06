import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { generateResearchSummary } from "./services/perplexity";
import { extractTextFromPDF } from "./services/pdf-extractor";
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

      // Generate research summary using Perplexity API
      const summary = await generateResearchSummary(pdfText);
      
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
        });
        textSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { text } = req.body;
      
      // Generate research summary using Perplexity API
      const summary = await generateResearchSummary(text);
      
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
        });
        keywordsSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { keywords, sourcesLimit } = req.body;
      
      // Generate research summary using Perplexity API
      const summary = await generateResearchSummary(
        `Provide a comprehensive literature review on the following topics: ${keywords}. 
        Include up to ${sourcesLimit} academic sources.`
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

  const httpServer = createServer(app);
  return httpServer;
}
