import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, connecting
  lastActivity: timestamp("last_activity").defaultNow(),
  connectedSince: timestamp("connected_since"),
  messagesCount: integer("messages_count").default(0),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  message: text("message").notNull(),
  mediaPath: text("media_path"),
  timestamp: timestamp("timestamp").defaultNow(),
  isOutgoing: boolean("is_outgoing").default(false),
  isRead: boolean("is_read").default(false),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  id: true,
  name: true,
  phone: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  from: true,
  to: true,
  message: true,
  mediaPath: true,
  isOutgoing: true,
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  content: true,
});

export const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  to: z.string().min(1),
  message: z.string().min(1),
  media: z.string().optional(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
