// WhatsApp Web.js Service untuk Next.js
import { Client, LocalAuth } from 'whatsapp-web.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import QRCode from 'qrcode';

interface UserSession {
  status: string;
  lastActivity?: Date;
}

interface WhatsAppStatus {
  isReady: boolean;
  qrCode?: string;
  status: string;
  connectedNumber?: string;
  error?: string;
}

// Chat status constants
export const CHAT_STATUS = {
  INACTIVE: 'inactive',
  WAITING_COMMAND: 'waiting_command',
  ACTIVE: 'active',
  WAITING_FEEDBACK: 'waiting_feedback',
};

class WhatsAppService {
  private client: Client | null = null;
  private isInitializing = false;
  private currentQR: string | null = null;
  private status: WhatsAppStatus = {
    isReady: false,
    status: 'disconnected'
  };
  private userSessions = new Map<string, UserSession>();
  private genAI: GoogleGenerativeAI | null = null;
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize Gemini AI if API key is available
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  // Event system for real-time updates
  on(event: string, callback: Function) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)?.push(callback);
  }

  private emit(event: string, data?: any) {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  async initialize(): Promise<void> {
    if (this.client || this.isInitializing) {
      console.log('WhatsApp client already exists or initializing');
      return;
    }

    this.isInitializing = true;
    this.status = { isReady: false, status: 'initializing' };
    this.emit('status', this.status);

    try {
      // Initialize WhatsApp Client
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsapp-chatbot-web',
        }),
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
            '--disable-gpu',
          ],
        },
      });

      this.setupEventHandlers();
      await this.client.initialize();
    } catch (error: any) {
      console.error('Error initializing WhatsApp client:', error);
      this.status = { 
        isReady: false, 
        status: 'error', 
        error: error.message 
      };
      this.emit('status', this.status);
      this.isInitializing = false;
    }
  }

  private setupEventHandlers() {
    if (!this.client) return;

    // QR Code handler
    this.client.on('qr', async (qr: string) => {
      console.log('QR Code received');
      
      try {
        // Generate QR code as base64 image
        const qrBase64 = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        });
        
        // Remove data:image/png;base64, prefix for storage
        const base64Data = qrBase64.split(',')[1];
        
        this.currentQR = base64Data;
        this.status = { 
          isReady: false, 
          status: 'waiting_for_qr_scan', 
          qrCode: base64Data 
        };
        this.emit('qr', base64Data);
        this.emit('status', this.status);
      } catch (error) {
        console.error('Error generating QR code image:', error);
        this.currentQR = qr;
        this.status = { 
          isReady: false, 
          status: 'waiting_for_qr_scan', 
          qrCode: qr 
        };
        this.emit('qr', qr);
        this.emit('status', this.status);
      }
    });

    // Loading handler
    this.client.on('loading_screen', (percent: number, message: string) => {
      console.log(`Loading: ${percent}% - ${message}`);
      this.status = { 
        isReady: false, 
        status: 'loading', 
        error: `${percent}% - ${message}` 
      };
      this.emit('loading', { percent, message });
      this.emit('status', this.status);
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('WhatsApp authenticated successfully!');
      this.status = { 
        isReady: false, 
        status: 'authenticated' 
      };
      this.emit('authenticated');
      this.emit('status', this.status);
    });

    // Authentication failure
    this.client.on('auth_failure', (msg: string) => {
      console.error('Authentication failed:', msg);
      this.status = { 
        isReady: false, 
        status: 'auth_failure', 
        error: msg 
      };
      this.emit('auth_failure', msg);
      this.emit('status', this.status);
      this.isInitializing = false;
    });

    // Client ready
    this.client.on('ready', async () => {
      console.log('WhatsApp Client is ready!');
      
      try {
        const info = this.client?.info;
        this.status = { 
          isReady: true, 
          status: 'connected',
          connectedNumber: info?.wid?.user || 'Unknown'
        };
        
        this.emit('ready');
        this.emit('status', this.status);
        this.isInitializing = false;
        
        console.log('Connected as:', info?.pushname || info?.wid?.user);
      } catch (error) {
        console.error('Error getting client info:', error);
      }
    });

    // Disconnect handler
    this.client.on('disconnected', (reason: string) => {
      console.log('WhatsApp Client disconnected:', reason);
      this.status = { 
        isReady: false, 
        status: 'disconnected', 
        error: reason 
      };
      this.emit('disconnected', reason);
      this.emit('status', this.status);
    });

    // Error handler
    this.client.on('error', (error: Error) => {
      console.error('WhatsApp Client error:', error);
      this.status = { 
        isReady: false, 
        status: 'error', 
        error: error.message 
      };
      this.emit('error', error);
      this.emit('status', this.status);
    });

    // Message handler
    this.client.on('message', async (msg: any) => {
      await this.handleIncomingMessage(msg);
    });
  }

  private async handleIncomingMessage(msg: any) {
    const incomingText = msg.body.trim();
    const sender = msg.from;

    console.log(`Message from ${sender}: ${incomingText}`);

    // Authorization check
    if (!this.isAuthorizedUser(sender)) {
      console.log(`Access denied for ${sender} - Not in authorized users list`);
      return;
    }

    // Get or create user session
    if (!this.userSessions.has(sender)) {
      this.userSessions.set(sender, { status: CHAT_STATUS.INACTIVE });
    }

    const userSession = this.userSessions.get(sender)!;

    try {
      // Handle trigger command
      if (userSession.status === CHAT_STATUS.INACTIVE) {
        if (incomingText.toLowerCase() === '/klinik_pemdi') {
          userSession.status = CHAT_STATUS.WAITING_COMMAND;
          this.userSessions.set(sender, userSession);

          const menuMessage = `Selamat datang di layanan chatbot Klinik PEMDI! 👋

Silakan pilih salah satu opsi berikut dengan mengetik angka atau teks:

1️⃣ *Bertanya tentang Klinik PEMDI* (ketik: 1 atau tanya)
2️⃣ *Tidak Memerlukan Layanan* (ketik: 2 atau tidak)

Contoh: ketik "1" untuk mulai bertanya`;

          await this.client?.sendMessage(sender, menuMessage);
          console.log(`Chatbot activated for ${sender} with trigger /klinik_pemdi`);
          return;
        } else {
          console.log(`Message ignored from ${sender} - Not trigger command /klinik_pemdi`);
          return;
        }
      }

      // Handle command selection
      if (userSession.status === CHAT_STATUS.WAITING_COMMAND) {
        const lowerText = incomingText.toLowerCase();

        if (lowerText === '1' || lowerText === 'tanya' || lowerText.includes('tanya')) {
          userSession.status = CHAT_STATUS.ACTIVE;
          this.userSessions.set(sender, userSession);

          await msg.reply('Silakan bertanya tentang kebutuhan Anda terkait Klinik PEMDI. Saya siap membantu! 😊');
          console.log(`Chatbot activated for ${sender} - question mode`);
          return;
        } else if (lowerText === '2' || lowerText === 'tidak' || lowerText.includes('tidak')) {
          await msg.reply('Terima kasih telah menggunakan layanan kami! 🙏');
          userSession.status = CHAT_STATUS.INACTIVE;
          this.userSessions.set(sender, userSession);
          console.log(`Session ended for ${sender} - User declined service`);
          return;
        } else {
          // Resend menu if invalid option
          const menuMessage = `Mohon pilih salah satu opsi yang tersedia:

1️⃣ *Bertanya tentang Klinik PEMDI* (ketik: 1 atau tanya)
2️⃣ *Tidak Memerlukan Layanan* (ketik: 2 atau tidak)

Contoh: ketik "1" untuk mulai bertanya`;

          await this.client?.sendMessage(sender, menuMessage);
          console.log(`Menu resent to ${sender}`);
          return;
        }
      }

      // Handle feedback response
      if (userSession.status === CHAT_STATUS.WAITING_FEEDBACK) {
        const lowerText = incomingText.toLowerCase();

        if (lowerText.includes('tidak puas') || lowerText.includes('tidak') || 
            lowerText.includes('kurang') || lowerText === '2' || 
            lowerText === 'no' || lowerText === 'n') {
          
          await msg.reply('Mohon maaf atas ketidakpuasan Anda. Silakan isi feedback di Google Form: https://aws.amazon.com/id/what-is/retrieval-augmented-generation');
          userSession.status = CHAT_STATUS.INACTIVE;
          this.userSessions.set(sender, userSession);
          console.log(`Session ended for ${sender} - User not satisfied`);
          return;
        } else if (lowerText.includes('ya, puas') || lowerText === 'ya' || 
                   lowerText === 'puas' || lowerText === '1' || 
                   lowerText === 'yes' || lowerText === 'y') {
          
          await msg.reply('Terima kasih telah menggunakan layanan chatbot klinik pemdi');
          userSession.status = CHAT_STATUS.INACTIVE;
          this.userSessions.set(sender, userSession);
          console.log(`Session ended for ${sender} - User satisfied`);
          return;
        } else {
          // Resend feedback options
          const feedbackMessage = `Silakan pilih salah satu opsi feedback yang tersedia:

1️⃣ *Ya, puas* (ketik: ya atau 1)
2️⃣ *Tidak puas* (ketik: tidak atau 2)

Silakan berikan feedback Anda`;

          await this.client?.sendMessage(sender, feedbackMessage);
          return;
        }
      }

      // Handle active chat questions
      if (userSession.status === CHAT_STATUS.ACTIVE) {
        try {
          // Get context from RAG
          const contextualChunks = await this.getContextFromRAG(incomingText);
          
          // Generate response using Gemini
          const reply = await this.generateResponse(incomingText, contextualChunks);
          
          // Send main reply
          await msg.reply(reply);
          
          // Send feedback request
          const feedbackMessage = `Apakah anda puas dengan jawabannya?

1️⃣ *Ya, puas* (ketik: ya atau 1)
2️⃣ *Tidak puas* (ketik: tidak atau 2)

Silakan pilih salah satu opsi di atas`;

          await this.client?.sendMessage(sender, feedbackMessage);
          
          // Update status to waiting feedback
          userSession.status = CHAT_STATUS.WAITING_FEEDBACK;
          this.userSessions.set(sender, userSession);
          
          console.log(`Reply sent to ${sender}, waiting for feedback`);
          return;
        } catch (error: any) {
          console.error(`Error processing question from ${sender}:`, error.message);
          await msg.reply('Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.');
          
          userSession.status = CHAT_STATUS.INACTIVE;
          this.userSessions.set(sender, userSession);
          return;
        }
      }
    } catch (err: any) {
      console.error(`Failed to process message from ${sender}`, err.message);
      
      // Reset session on error
      userSession.status = CHAT_STATUS.INACTIVE;
      this.userSessions.set(sender, userSession);
      
      await msg.reply('Maaf, terjadi kesalahan. Silakan coba lagi dengan mengirim pesan apa saja untuk memulai ulang.');
    }
  }

  private isAuthorizedUser(phoneNumber: string): boolean {
    const authorizedNumbers = process.env.AUTHORIZED_NUMBERS
      ? process.env.AUTHORIZED_NUMBERS.split(',').map(num => num.trim())
      : [];

    // If no authorized numbers, allow all
    if (authorizedNumbers.length === 0) {
      return true;
    }

    const cleanNumber = phoneNumber.replace('@c.us', '').replace('@g.us', '');
    
    return authorizedNumbers.some(authNum => {
      const cleanAuthNum = authNum.replace(/\D/g, '');
      const cleanIncomingNum = cleanNumber.replace(/\D/g, '');
      
      return cleanIncomingNum.includes(cleanAuthNum) || cleanAuthNum.includes(cleanIncomingNum);
    });
  }

  private async getContextFromRAG(message: string): Promise<string[]> {
    try {
      const response = await axios.post(
        `${process.env.RAG_SERVICE_URL}/admin/context/searchtest/`,
        { message }
      );
      return response.data.results;
    } catch (error: any) {
      console.error('Error accessing RAG service:', error.message);
      return [];
    }
  }

  private async generateResponse(message: string, contextualChunks: string[]): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    try {
      const combinedContext = contextualChunks.join('\n\n---\n\n');

      const prompt = `Kamu adalah asisten cerdas yang menjawab pertanyaan hanya berdasarkan informasi yang diberikan dari dokumen internal. berikan jawaban profesional yang panjang. Jika jawabannya tidak ditemukan di dokumen, katakan dengan jujur bahwa kamu tidak tahu atau informasinya tidak tersedia.

=== Informasi Konteks ===
${combinedContext}
=======================

Pertanyaan:
${message}

Berdasarkan informasi konteks di atas, jawablah pertanyaan dengan jelas dan detail:`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([prompt]);
      const response = await result.response;

      return response.text();
    } catch (error: any) {
      console.error('Error generating response:', error.message);
      throw error;
    }
  }

  // Public methods for API access
  async getContextFromRAGPublic(message: string): Promise<string[]> {
    return this.getContextFromRAG(message);
  }

  async generateResponsePublic(message: string, contextualChunks: string[]): Promise<string> {
    return this.generateResponse(message, contextualChunks);
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      await this.client.sendMessage(`${to}@c.us`, message);
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  }

  async sendTicket(receiver: string, ticketData: any): Promise<boolean> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      let ticketMessage = `🎫 *KONFIRMASI TIKET KONSULTASI*
━━━━━━━━━━━━━━━━━━━━━━━

✅ Konsultasi Anda telah berhasil terdaftar!

📋 *DETAIL TIKET:*
• Nomor Tiket: *${ticketData.ticket}*`;

      if (ticketData.nama) {
        ticketMessage += `\n• Nama: ${ticketData.nama}`;
      }
      
      if (ticketData.instansi) {
        ticketMessage += `\n• Instansi: ${ticketData.instansi}`;
      }

      if (ticketData.kota && ticketData.provinsi) {
        ticketMessage += `\n• Asal: ${ticketData.kota}, ${ticketData.provinsi}`;
      }

      if (ticketData.topikKonsultasi && Array.isArray(ticketData.topikKonsultasi) && ticketData.topikKonsultasi.length > 0) {
        ticketMessage += `\n• Topik: ${ticketData.topikKonsultasi.slice(0, 2).join(', ')}`;
        if (ticketData.topikKonsultasi.length > 2) {
          ticketMessage += ` (+${ticketData.topikKonsultasi.length - 2} lainnya)`;
        }
      }

      if (ticketData.fokusTujuan) {
        ticketMessage += `\n• Fokus: ${ticketData.fokusTujuan.length > 50 ? ticketData.fokusTujuan.substring(0, 50) + '...' : ticketData.fokusTujuan}`;
      }

      ticketMessage += `\n\n💬 *KEBUTUHAN KONSULTASI:*\n${ticketData.uraianKebutuhan || 'Tidak ada detail tambahan'}`;

      if (ticketData.konsultasiLanjut === 'Ya' && ticketData.mekanisme) {
        ticketMessage += `\n\n📞 *KONSULTASI LANJUT:*\nMekanisme: ${ticketData.mekanisme}`;
      }

      ticketMessage += `\n\n━━━━━━━━━━━━━━━━━━━━━━━
💾 *Simpan tiket ini untuk referensi konsultasi Anda*
🕒 Tim kami akan segera memproses permintaan Anda
📞 Hubungi kami jika ada pertanyaan

Terima kasih! 🙏`;

      await this.client.sendMessage(`${receiver}@c.us`, ticketMessage);
      return true;
    } catch (error: any) {
      console.error('Error sending ticket:', error.message);
      throw error;
    }
  }

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  getCurrentQR(): string | null {
    return this.currentQR;
  }

  getUserSessions(): Map<string, UserSession> {
    return this.userSessions;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.status = { isReady: false, status: 'disconnected' };
      this.emit('status', this.status);
    }
  }

  async logout(): Promise<void> {
    if (this.client) {
      await this.client.logout();
      this.status = { isReady: false, status: 'logged_out' };
      this.emit('status', this.status);
    }
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

export default whatsappService;
