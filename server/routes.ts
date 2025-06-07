import type { Express } from "express";
import { createServer, type Server } from "http";
import { sendMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|wav|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Web Multi-Session API',
      version: '1.0.0',
      description: 'REST API for managing WhatsApp Web sessions and sending messages',
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server/routes.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Dynamic imports for CommonJS modules
  const { setupSocket } = await import('./socket-simple.js');
  const { storage } = await import('./storage-simple.js');
  
  const io = setupSocket(httpServer, storage);

  // Swagger documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

  /**
   * @swagger
   * /sessions:
   *   get:
   *     summary: Get all WhatsApp sessions
   *     tags: [Sessions]
   *     responses:
   *       200:
   *         description: List of all sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sessions:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       phone:
   *                         type: string
   *                       status:
   *                         type: string
   *                       lastActivity:
   *                         type: string
   *                         format: date-time
   *                       messagesCount:
   *                         type: number
   */
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json({ sessions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  /**
   * @swagger
   * /sessions/{id}:
   *   get:
   *     summary: Get a specific session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session details
   *       404:
   *         description: Session not found
   */
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  /**
   * @swagger
   * /sessions:
   *   post:
   *     summary: Create a new WhatsApp session
   *     tags: [Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *               name:
   *                 type: string
   *     responses:
   *       201:
   *         description: Session created successfully
   *       400:
   *         description: Invalid request data
   */
  app.post("/api/sessions", async (req, res) => {
    try {
      const { id, name } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: "Session ID and name are required" });
      }

      const existingSession = await storage.getSession(id);
      if (existingSession) {
        return res.status(400).json({ error: "Session already exists" });
      }

      const session = await storage.createSession({
        id,
        name,
        phone: "",
        status: "connecting",
      });

      // Initialize WhatsApp session via socket
      io.emit('initialize_session_request', { sessionId: id });

      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  /**
   * @swagger
   * /sessions/{id}:
   *   delete:
   *     summary: Delete a session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session deleted successfully
   *       404:
   *         description: Session not found
   */
  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Disconnect WhatsApp session via socket
      io.emit('disconnect_session_request', { sessionId: req.params.id });

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  /**
   * @swagger
   * /send-message:
   *   post:
   *     summary: Send a WhatsApp message
   *     tags: [Messages]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               sessionId:
   *                 type: string
   *               to:
   *                 type: string
   *               message:
   *                 type: string
   *               media:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Message sent successfully
   *       400:
   *         description: Invalid request data
   */
  app.post("/api/send-message", upload.single('media'), async (req, res) => {
    try {
      const validation = sendMessageSchema.safeParse({
        sessionId: req.body.sessionId,
        to: req.body.to,
        message: req.body.message,
        media: req.file?.path,
      });

      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { sessionId, to, message } = validation.data;
      const mediaPath = req.file?.path;

      // Send message via socket
      io.emit('send_message_request', {
        sessionId,
        to,
        message,
        mediaPath
      });

      res.json({
        success: true,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  /**
   * @swagger
   * /messages:
   *   get:
   *     summary: Get messages
   *     tags: [Messages]
   *     parameters:
   *       - in: query
   *         name: sessionId
   *         schema:
   *           type: string
   *         description: Filter by session ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *         description: Limit number of messages
   *     responses:
   *       200:
   *         description: List of messages
   */
  app.get("/api/messages", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const messages = await storage.getMessages(sessionId, limit);
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  /**
   * @swagger
   * /messages/{id}/read:
   *   put:
   *     summary: Mark message as read
   *     tags: [Messages]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Message marked as read
   */
  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(id);
      
      if (!success) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json({ message: "Message marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  /**
   * @swagger
   * /templates:
   *   get:
   *     summary: Get message templates
   *     tags: [Templates]
   *     responses:
   *       200:
   *         description: List of templates
   */
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json({ templates });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  /**
   * @swagger
   * /templates:
   *   post:
   *     summary: Create a new template
   *     tags: [Templates]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               content:
   *                 type: string
   *     responses:
   *       201:
   *         description: Template created successfully
   */
  app.post("/api/templates", async (req, res) => {
    try {
      const { name, content } = req.body;
      
      if (!name || !content) {
        return res.status(400).json({ error: "Name and content are required" });
      }

      const template = await storage.createTemplate({ name, content });
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  /**
   * @swagger
   * /stats:
   *   get:
   *     summary: Get system statistics
   *     tags: [System]
   *     responses:
   *       200:
   *         description: System statistics
   */
  app.get("/api/stats", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      const unreadCount = await storage.getUnreadMessageCount();
      
      res.json({
        totalSessions: sessions.length,
        connectedSessions: sessions.filter(s => s.status === 'connected').length,
        unreadMessages: unreadCount,
        lastSync: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
