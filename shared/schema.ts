import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Citation model
export interface Citation {
  authors: string;
  text: string;
  url?: string;
}

// Research summary model
export interface ResearchSummary {
  title: string;
  content: string;
  citations: Citation[];
}

// Database tables
export const researchSummaries = pgTable("research_summaries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Citation[]>().notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Request schema for generating research
export const generateResearchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pdf"),
    pdfFile: z.any(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(10, "Text must be at least 10 characters long"),
  }),
  z.object({
    type: z.literal("keywords"),
    keywords: z.string().min(3, "Keywords must be at least 3 characters long"),
    sourcesLimit: z.number().int().min(1).max(20).default(10),
  }),
]);

export const insertResearchSummarySchema = createInsertSchema(researchSummaries).omit({
  id: true,
});

export type InsertResearchSummary = z.infer<typeof insertResearchSummarySchema>;
export type GenerateResearchRequest = z.infer<typeof generateResearchSchema>;
export type User = typeof users.$inferSelect;

// Keep existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
