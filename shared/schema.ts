import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** Database schema definitions shared by the worker and app. */

// Base user schema (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Search queries
export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSearchSchema = createInsertSchema(searches).pick({
  query: true,
});

// Results from models
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").notNull(),
  modelId: text("model_id").notNull(),
  content: text("content").notNull(),
  title: text("title"),
  responseTime: integer("response_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResultSchema = createInsertSchema(results).pick({
  searchId: true,
  modelId: true,
  content: true,
  title: true,
  responseTime: true,
});

// Click tracking
export const clicks = pgTable("clicks", {
  id: serial("id").primaryKey(),
  resultId: integer("result_id").notNull(),
  userId: integer("user_id"), // Optional: track by user if authenticated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClickSchema = createInsertSchema(clicks).pick({
  resultId: true,
  userId: true,
});

// Model statistics for analytics
export const modelStats = pgTable("model_stats", {
  id: serial("id").primaryKey(),
  modelId: text("model_id").notNull().unique(),
  clickCount: integer("click_count").notNull().default(0),
  searchCount: integer("search_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertModelStatSchema = createInsertSchema(modelStats).pick({
  modelId: true,
  clickCount: true,
  searchCount: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;

export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof results.$inferSelect;

export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;

export type InsertModelStat = z.infer<typeof insertModelStatSchema>;
export type ModelStat = typeof modelStats.$inferSelect;
