import { users, type User, type InsertUser, type ResearchSummary } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveResearchSummary(summary: ResearchSummary): Promise<ResearchSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private researchSummaries: Map<number, ResearchSummary & { id: number }>;
  currentId: number;
  currentSummaryId: number;

  constructor() {
    this.users = new Map();
    this.researchSummaries = new Map();
    this.currentId = 1;
    this.currentSummaryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveResearchSummary(summary: ResearchSummary): Promise<ResearchSummary> {
    const id = this.currentSummaryId++;
    const savedSummary = { ...summary, id };
    this.researchSummaries.set(id, savedSummary);
    return summary; // Return without the id to match the ResearchSummary interface
  }
}

export const storage = new MemStorage();
