import { 
  User, InsertUser, users,
  Search, InsertSearch, searches,
  Result, InsertResult, results,
  Click, InsertClick, clicks,
  ModelStat, InsertModelStat, modelStats
} from "@shared/schema";

// Interface for our storage methods
export interface IStorage {
  // User methods (keeping existing ones)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search methods
  createSearch(search: InsertSearch): Promise<Search>;
  getSearchById(id: number): Promise<Search | undefined>;
  getRecentSearches(limit?: number): Promise<Search[]>;
  
  // Result methods
  createResult(result: InsertResult): Promise<Result>;
  getResultById(id: number): Promise<Result | undefined>;
  getResultsBySearchId(searchId: number): Promise<Result[]>;
  
  // Click tracking
  trackClick(click: InsertClick): Promise<Click>;
  getClicksByResultId(resultId: number): Promise<Click[]>;
  
  // Model analytics
  getModelStats(): Promise<ModelStat[]>;
  incrementModelClicks(modelId: string): Promise<void>;
  incrementModelSearches(modelId: string): Promise<void>;
  getTopModels(limit?: number): Promise<ModelStat[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private searches: Map<number, Search>;
  private searchResults: Map<number, Result>;
  private resultClicks: Map<number, Click>;
  private modelStatistics: Map<string, ModelStat>;
  
  private userIdCounter: number;
  private searchIdCounter: number;
  private resultIdCounter: number;
  private clickIdCounter: number;
  private modelStatIdCounter: number;

  constructor() {
    this.users = new Map();
    this.searches = new Map();
    this.searchResults = new Map();
    this.resultClicks = new Map();
    this.modelStatistics = new Map();
    
    this.userIdCounter = 1;
    this.searchIdCounter = 1;
    this.resultIdCounter = 1;
    this.clickIdCounter = 1;
    this.modelStatIdCounter = 1;
    
    // Initialize with some default models for OpenRouter
    this.setupDefaultModels();
  }
  
  private setupDefaultModels() {
    const defaultModels = [
      "openai/gpt-4",
      "anthropic/claude-2", 
      "meta-llama/llama-2-70b-chat",
      "mistralai/mistral-7b-instruct"
    ];
    
    defaultModels.forEach((modelId, index) => {
      const id = this.modelStatIdCounter++;
      const stat: ModelStat = {
        id,
        modelId,
        clickCount: 0,
        searchCount: 0,
        updatedAt: new Date()
      };
      this.modelStatistics.set(modelId, stat);
    });
  }

  // User methods (keeping existing functionality)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Search methods
  async createSearch(search: InsertSearch): Promise<Search> {
    const id = this.searchIdCounter++;
    const newSearch: Search = { 
      ...search, 
      id, 
      createdAt: new Date() 
    };
    this.searches.set(id, newSearch);
    return newSearch;
  }
  
  async getSearchById(id: number): Promise<Search | undefined> {
    return this.searches.get(id);
  }
  
  async getRecentSearches(limit: number = 10): Promise<Search[]> {
    return Array.from(this.searches.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  // Result methods
  async createResult(result: InsertResult): Promise<Result> {
    const id = this.resultIdCounter++;
    const newResult: Result = { 
      ...result, 
      id, 
      createdAt: new Date() 
    };
    this.searchResults.set(id, newResult);
    return newResult;
  }
  
  async getResultById(id: number): Promise<Result | undefined> {
    return this.searchResults.get(id);
  }
  
  async getResultsBySearchId(searchId: number): Promise<Result[]> {
    return Array.from(this.searchResults.values())
      .filter(result => result.searchId === searchId);
  }
  
  // Click tracking
  async trackClick(click: InsertClick): Promise<Click> {
    const id = this.clickIdCounter++;
    const newClick: Click = { 
      ...click, 
      id, 
      createdAt: new Date() 
    };
    this.resultClicks.set(id, newClick);
    
    // Get the result to find the associated model
    const result = await this.getResultById(click.resultId);
    if (result) {
      await this.incrementModelClicks(result.modelId);
    }
    
    return newClick;
  }
  
  async getClicksByResultId(resultId: number): Promise<Click[]> {
    return Array.from(this.resultClicks.values())
      .filter(click => click.resultId === resultId);
  }
  
  // Model analytics
  async getModelStats(): Promise<ModelStat[]> {
    return Array.from(this.modelStatistics.values());
  }
  
  async incrementModelClicks(modelId: string): Promise<void> {
    const existingStat = this.modelStatistics.get(modelId);
    
    if (existingStat) {
      existingStat.clickCount += 1;
      existingStat.updatedAt = new Date();
      this.modelStatistics.set(modelId, existingStat);
    } else {
      const id = this.modelStatIdCounter++;
      const newStat: ModelStat = {
        id,
        modelId,
        clickCount: 1,
        searchCount: 0,
        updatedAt: new Date()
      };
      this.modelStatistics.set(modelId, newStat);
    }
  }
  
  async incrementModelSearches(modelId: string): Promise<void> {
    const existingStat = this.modelStatistics.get(modelId);
    
    if (existingStat) {
      existingStat.searchCount += 1;
      existingStat.updatedAt = new Date();
      this.modelStatistics.set(modelId, existingStat);
    } else {
      const id = this.modelStatIdCounter++;
      const newStat: ModelStat = {
        id,
        modelId,
        clickCount: 0,
        searchCount: 1,
        updatedAt: new Date()
      };
      this.modelStatistics.set(modelId, newStat);
    }
  }
  
  async getTopModels(limit: number = 5): Promise<ModelStat[]> {
    return Array.from(this.modelStatistics.values())
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();