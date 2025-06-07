// Simple in-memory storage implementation in CommonJS
class SimpleStorage {
  constructor() {
    this.sessions = new Map();
    this.messages = new Map();
    this.templates = new Map();
    this.currentMessageId = 1;
    this.currentTemplateId = 1;

    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  initializeDefaultTemplates() {
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
  async getSession(id) {
    return this.sessions.get(id);
  }

  async getAllSessions() {
    return Array.from(this.sessions.values());
  }

  async createSession(insertSession) {
    const session = {
      id: insertSession.id,
      name: insertSession.name,
      phone: insertSession.phone || '',
      status: insertSession.status || 'disconnected',
      lastActivity: new Date(),
      connectedSince: new Date(),
      messagesCount: 0,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async updateSession(id, updates) {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id) {
    return this.sessions.delete(id);
  }

  // Message methods
  async getMessage(id) {
    return this.messages.get(id);
  }

  async getMessages(sessionId, limit) {
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

  async createMessage(insertMessage) {
    const id = this.currentMessageId++;
    const message = {
      id,
      sessionId: insertMessage.sessionId,
      from: insertMessage.from,
      to: insertMessage.to,
      message: insertMessage.message,
      mediaPath: insertMessage.mediaPath || null,
      timestamp: new Date(),
      isOutgoing: insertMessage.isOutgoing || false,
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

  async markMessageAsRead(id) {
    const message = this.messages.get(id);
    if (!message) return false;

    message.isRead = true;
    this.messages.set(id, message);
    return true;
  }

  async getUnreadMessageCount() {
    return Array.from(this.messages.values()).filter(msg => !msg.isRead && !msg.isOutgoing).length;
  }

  // Template methods
  async getTemplates() {
    return Array.from(this.templates.values());
  }

  async createTemplate(insertTemplate) {
    const id = this.currentTemplateId++;
    const template = {
      id,
      name: insertTemplate.name,
      content: insertTemplate.content,
    };
    this.templates.set(id, template);
    return template;
  }

  async deleteTemplate(id) {
    return this.templates.delete(id);
  }
}

const storage = new SimpleStorage();
export { storage };