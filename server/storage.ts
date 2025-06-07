import { sessions, messages, templates, type Session, type InsertSession, type Message, type InsertMessage, type Template, type InsertTemplate } from "@shared/schema";

export interface IStorage {
  // Session management
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;

  // Message management
  getMessage(id: number): Promise<Message | undefined>;
  getMessages(sessionId?: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  getUnreadMessageCount(): Promise<number>;

  // Template management
  getTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  deleteTemplate(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private messages: Map<number, Message>;
  private templates: Map<number, Template>;
  private currentMessageId: number;
  private currentTemplateId: number;

  constructor() {
    this.sessions = new Map();
    this.messages = new Map();
    this.templates = new Map();
    this.currentMessageId = 1;
    this.currentTemplateId = 1;

    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    this.createTemplate({
      name: "Welcome Message",
      content: "Hello! Thank you for your interest. How can we help you today?"
    });
    this.createTemplate({
      name: "Follow Up",
      content: "Hi! Just following up on our previous conversation. Any questions?"
    });
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      ...insertSession,
      status: insertSession.status || 'disconnected',
      lastActivity: new Date(),
      connectedSince: new Date(),
      messagesCount: 0,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(sessionId?: string, limit?: number): Promise<Message[]> {
    let messageList = Array.from(this.messages.values());
    
    if (sessionId) {
      messageList = messageList.filter(msg => msg.sessionId === sessionId);
    }
    
    messageList.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    
    if (limit) {
      messageList = messageList.slice(0, limit);
    }
    
    return messageList;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      mediaPath: insertMessage.mediaPath || null,
      isOutgoing: insertMessage.isOutgoing || false,
      timestamp: new Date(),
      isRead: false,
    };
    this.messages.set(id, message);

    // Update session message count
    const session = this.sessions.get(message.sessionId);
    if (session) {
      session.messagesCount = (session.messagesCount || 0) + 1;
      session.lastActivity = new Date();
      this.sessions.set(session.id, session);
    }

    return message;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;

    message.isRead = true;
    this.messages.set(id, message);
    return true;
  }

  async getUnreadMessageCount(): Promise<number> {
    return Array.from(this.messages.values()).filter(msg => !msg.isRead && !msg.isOutgoing).length;
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const template: Template = {
      ...insertTemplate,
      id,
    };
    this.templates.set(id, template);
    return template;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }
}

export const storage = new MemStorage();
