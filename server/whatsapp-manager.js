const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
  constructor(io, storage) {
    this.sessions = new Map();
    this.io = io;
    this.storage = storage;
  }

  async initializeSession(sessionId) {
    try {
      if (this.sessions.has(sessionId)) {
        return true;
      }

      const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      // Handle QR code generation
      client.on('qr', (qr) => {
        console.log(`QR Code generated for session ${sessionId}`);
        this.io.emit('qr', { sessionId, qr });
      });

      // Handle successful authentication
      client.on('authenticated', async () => {
        console.log(`Session ${sessionId} authenticated`);
        await this.storage.updateSession(sessionId, { 
          status: 'connected',
          connectedSince: new Date(),
          lastActivity: new Date()
        });
        this.io.emit('session_status', { sessionId, status: 'connected' });
      });

      // Handle ready state
      client.on('ready', async () => {
        console.log(`Session ${sessionId} is ready`);
        const info = client.info;
        await this.storage.updateSession(sessionId, {
          name: info.pushname || 'Unknown',
          phone: info.wid.user,
          status: 'connected',
          lastActivity: new Date()
        });

        this.sessions.set(sessionId, {
          id: sessionId,
          client,
          isReady: true
        });

        this.io.emit('session_ready', { sessionId, info });
      });

      // Handle incoming messages
      client.on('message', async (message) => {
        try {
          const contact = await message.getContact();

          await this.storage.createMessage({
            sessionId,
            from: contact.number || contact.id.user,
            to: client.info.wid.user,
            message: message.body,
            isOutgoing: false
          });

          this.io.emit('new_message', {
            sessionId,
            from: contact.name || contact.number || contact.id.user,
            message: message.body,
            timestamp: new Date()
          });

          console.log(`New message received in session ${sessionId} from ${contact.number}`);
        } catch (error) {
          console.error('Error handling incoming message:', error);
        }
      });

      // Handle disconnection
      client.on('disconnected', async (reason) => {
        console.log(`Session ${sessionId} disconnected:`, reason);
        await this.storage.updateSession(sessionId, { status: 'disconnected' });
        this.sessions.delete(sessionId);
        this.io.emit('session_status', { sessionId, status: 'disconnected' });
      });

      // Initialize the client
      await client.initialize();
      
      return true;
    } catch (error) {
      console.error(`Error initializing session ${sessionId}:`, error);
      await this.storage.updateSession(sessionId, { status: 'disconnected' });
      return false;
    }
  }

  async sendMessage(sessionId, to, message, mediaPath) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.isReady) {
        throw new Error('Session not ready or not found');
      }

      // Format phone number
      const formattedNumber = to.replace(/[^\d]/g, '');
      const chatId = `${formattedNumber}@c.us`;

      let sentMessage;
      if (mediaPath && fs.existsSync(mediaPath)) {
        const media = MessageMedia.fromFilePath(mediaPath);
        sentMessage = await session.client.sendMessage(chatId, media, { caption: message });
      } else {
        sentMessage = await session.client.sendMessage(chatId, message);
      }

      // Store in database
      await this.storage.createMessage({
        sessionId,
        from: session.client.info.wid.user,
        to: formattedNumber,
        message,
        mediaPath,
        isOutgoing: true
      });

      console.log(`Message sent from session ${sessionId} to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async disconnectSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        await session.client.destroy();
        this.sessions.delete(sessionId);
      }

      await this.storage.updateSession(sessionId, { status: 'disconnected' });
      this.io.emit('session_status', { sessionId, status: 'disconnected' });
      
      console.log(`Session ${sessionId} disconnected`);
      return true;
    } catch (error) {
      console.error('Error disconnecting session:', error);
      return false;
    }
  }

  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return 'disconnected';
    return session.isReady ? 'connected' : 'connecting';
  }

  getAllSessionStatuses() {
    const statuses = {};
    this.sessions.forEach((session, id) => {
      statuses[id] = session.isReady ? 'connected' : 'connecting';
    });
    return statuses;
  }
}

module.exports = { WhatsAppManager };