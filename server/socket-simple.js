import { Server as SocketServer } from 'socket.io';
import { SimpleWhatsAppManager } from './simple-whatsapp.js';

function setupSocket(server, storage) {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const whatsappManager = new SimpleWhatsAppManager(io, storage);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Initialize new session
    socket.on('initialize_session', async (data) => {
      const { sessionId } = data;
      try {
        // Create session in storage
        await storage.createSession({
          id: sessionId,
          name: 'New Session',
          phone: '',
          status: 'connecting'
        });

        // Initialize WhatsApp session
        await whatsappManager.initializeSession(sessionId);
      } catch (error) {
        console.error('Error initializing session:', error);
        socket.emit('session_error', { sessionId, error: String(error) });
      }
    });

    // Disconnect session
    socket.on('disconnect_session', async (data) => {
      const { sessionId } = data;
      try {
        await whatsappManager.disconnectSession(sessionId);
        await storage.deleteSession(sessionId);
      } catch (error) {
        console.error('Error disconnecting session:', error);
        socket.emit('session_error', { sessionId, error: String(error) });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { sessionId, to, message, mediaPath } = data;
      try {
        await whatsappManager.sendMessage(sessionId, to, message, mediaPath);
        socket.emit('message_sent', { sessionId, to, message });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { sessionId, error: String(error) });
      }
    });

    // Get session status
    socket.on('get_session_status', (data) => {
      const { sessionId } = data;
      const status = whatsappManager.getSessionStatus(sessionId);
      socket.emit('session_status', { sessionId, status });
    });

    // Get all session statuses
    socket.on('get_all_statuses', () => {
      const statuses = whatsappManager.getAllSessionStatuses();
      socket.emit('all_session_statuses', statuses);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export { setupSocket };