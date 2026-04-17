import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
    console.warn('Variabili mancanti nel file .env:', missingEnv.join(', '));
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Backend online'
    });
});

app.post('/api/contact', async (req, res) => {
    const { nome, email, servizio, messaggio } = req.body || {};

    if (!nome || !email || !servizio || !messaggio) {
        return res.status(400).json({
            success: false,
            message: 'Tutti i campi sono obbligatori.'
        });
    }

    const cleanNome = String(nome).trim();
    const cleanEmail = String(email).trim();
    const cleanServizio = String(servizio).trim();
    const cleanMessaggio = String(messaggio).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Email non valida.'
        });
    }

    const html = `
        <div style="font-family: Arial, sans-serif; background:#0d1117; color:#ffffff; padding:24px; border-radius:16px; border:1px solid #ae0fff;">
            <h2 style="margin-top:0; color:#0fffd2;">Nuova richiesta da Peppe.dev</h2>
            <p><strong>Nome:</strong> ${escapeHtml(cleanNome)}</p>
            <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
            <p><strong>Servizio:</strong> ${escapeHtml(cleanServizio)}</p>
            <p><strong>Messaggio:</strong><br>${escapeHtml(cleanMessaggio).replace(/\n/g, '<br>')}</p>
        </div>
    `;

    const text = [
        'Nuova richiesta da Peppe.dev',
        `Nome: ${cleanNome}`,
        `Email: ${cleanEmail}`,
        `Servizio: ${cleanServizio}`,
        'Messaggio:',
        cleanMessaggio
    ].join('\n');

    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to: process.env.MAIL_TO,
            replyTo: cleanEmail,
            subject: `Nuovo contatto dal sito - ${cleanServizio}`,
            text,
            html
        });

        console.log('Email inviata con successo:', info.messageId);

        return res.json({
            success: true,
            message: 'Messaggio inviato correttamente.'
        });
    } catch (error) {
        console.error('Errore invio email:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore durante l\'invio della mail.'
        });
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Errore configurazione SMTP:', error);
    } else {
        console.log('SMTP pronto:', success);
    }
});

app.listen(PORT, () => {
    console.log(`Server attivo su http://127.0.0.1:${PORT}`);
});