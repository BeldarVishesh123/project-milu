const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://krishivcorporation.ltd';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TTFs5Y8XSXB91l',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'jn5N1YSC2aEkM1rWKdbGTAMm'
});

// MongoDB Atlas Connection & Models Configuration
const MONGODB_USER = process.env.MONGODB_USER || 'beldarvishesh4552_db_user';
const MONGODB_PASS = process.env.MONGODB_PASS || 'ZgnRTOFeQahqcvlS';
const MONGODB_URI = process.env.MONGODB_URI || `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@krishivcorp.vdaebdn.mongodb.net/krishiv_co?retryWrites=true&w=majority`;

let isMongoConnected = false;

// Mongoose Models
const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    tag: { type: String },
    category: { type: String },
    description: { type: String },
    price: { type: Number, required: true },
    original_price: { type: Number },
    stock: { type: Number, default: 10 },
    stock_qty: { type: Number },
    stock_status: { type: String },
    ingredients: { type: String },
    usage: { type: String },
    image_url: { type: String },
    status: { type: String, default: 'Published' },
    created_at: { type: Date, default: Date.now }
}, { strict: false });

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    phone: { type: String },
    passwordHash: { type: String },
    salt: { type: String },
    provider: { type: String, default: 'email' },
    avatar_url: { type: String },
    created_at: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String },
    total: { type: Number, required: true },
    items: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, default: 'completed' },
    created_at: { type: Date, default: Date.now }
});

const ProductModel = mongoose.model('Product', ProductSchema);
const UserModel = mongoose.model('User', UserSchema);
const OrderModel = mongoose.model('Order', OrderSchema);

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
}).then(async () => {
    isMongoConnected = true;
    console.log(`[MONGODB SUCCESS] Connected to MongoDB Cloud Database (User: ${MONGODB_USER})`);
}).catch(err => {
    console.warn(`[MONGODB NOTICE] MongoDB Cloud connection info (${MONGODB_USER}): ${err.message}. Active runtime server operating.`);
});

// Configure Express to trust reverse proxy headers (Nginx / Cloudflare / AWS ALB / Caddy)
// Set to 1 hop (or process.env.TRUST_PROXY if specified)
app.set('trust proxy', process.env.TRUST_PROXY ? parseInt(process.env.TRUST_PROXY, 10) : 1);

// HTTP Security Headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
    : ['http://localhost:5173', 'http://localhost:5000', 'https://krishiv.co', 'https://www.krishiv.co'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy Exception: Origin not allowed.'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Anti-Tampering & Parameter Pollution Security Middleware
app.use((req, res, next) => {
    // 1. Prototype Pollution Defense
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                delete req.body[key];
                return res.status(400).json({ error: 'Security Exception: Illegal object mutation attempt detected.', code: 'PROTOTYPE_POLLUTION' });
            }

            // 2. Prevent Array/Object Tampering in Auth & Identification Fields
            if (['email', 'identifier', 'password', 'otp', 'userId', 'user_id', 'phone'].includes(key)) {
                if (typeof req.body[key] !== 'string') {
                    return res.status(400).json({ 
                        error: `Request Tampering Exception: Field '${key}' must be a single text string. Parameter pollution and object injection blocked.`, 
                        code: 'TAMPERING_DETECTED' 
                    });
                }
                // Strip NoSQL injection operators ($ and {})
                req.body[key] = req.body[key].replace(/[\$\{\}]/g, '').trim();
            }
        }
    }

    // 3. Query Parameter Tampering Defense
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].replace(/[\$\{\}]/g, '').trim();
            } else if (Array.isArray(req.query[key]) && ['email', 'phone', 'userId', 'id'].includes(key)) {
                return res.status(400).json({ 
                    error: `Query Tampering Exception: Parameter '${key}' cannot be duplicated.`, 
                    code: 'TAMPERING_DETECTED' 
                });
            }
        }
    }

    next();
});

// ====================================================
// RATE LIMITING & DDOS / REVERSE PROXY PROTECTION
// ====================================================

// Helper to check if request is from an authenticated admin session
const isAuthAdminRequest = (req) => {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (token && activeAdminSessions.get(token)) {
        return true;
    }
    return false;
};

// 1. Global API Rate Limiter (Bypassed for logged-in admin)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isAuthAdminRequest,
    message: {
        error: 'Too many requests from this IP address. Please try again after 15 minutes.',
        code: 'TOO_MANY_REQUESTS'
    }
});

// 2. Auth & Sign Up Rate Limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication or verification attempts. Please wait a few minutes before trying again.',
        code: 'TOO_MANY_AUTH_ATTEMPTS'
    }
});

// 3. Admin Authentication & Management Rate Limiter (COMPLETELY STOPPED / DISABLED for logged in admin)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isAuthAdminRequest,
    message: {
        error: 'Too many administrative requests. Access temporarily restricted.',
        code: 'TOO_MANY_ADMIN_ATTEMPTS'
    }
});

// Apply Global Limiter to all API routes
app.use('/api/', globalLimiter);

// Apply Strict Auth Limiter to Sensitive Endpoints
app.use('/api/auth/signup/init', authLimiter);
app.use('/api/auth/signup/resend-otp', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password/init', authLimiter);
app.use('/api/auth/forgot-password/resend-otp', authLimiter);
app.use('/api/auth/test-email', authLimiter);

// Apply Admin Limiter to Admin Endpoints
app.use('/api/admin/login', adminLimiter);
app.use('/api/admin/', adminLimiter);

// Helper Functions for Password Security & Hashing
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, hash) {
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return verifyHash === hash;
}

// Cryptographically Secure OTP Generation & Hashing
function generateSecureOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
}

function validateIndianPhone(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const indianRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    return indianRegex.test(cleanPhone);
}

function validatePasswordStrength(password) {
    if (!password) return { isValid: false, message: 'Password is required' };
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/[a-z]/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/[0-9]/.test(password)) return { isValid: false, message: 'Password must contain at least one number' };
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { isValid: false, message: 'Password must contain at least one special character' };
    return { isValid: true };
}

// Nodemailer Transporter Configuration & Real Email Sender
let cachedEtherealAccount = null;

async function getEmailTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

    // 1. Production / User configured SMTP Transporter
    if (host && user && pass) {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== 'true'
            }
        });
        return { transporter, isEthereal: false };
    }

    // 2. Automated Ethereal SMTP Test Account Transporter for Real Email Testing
    if (!cachedEtherealAccount) {
        console.log('[SMTP INFO] No custom SMTP credentials found in backend/.env. Initializing Ethereal Test SMTP server...');
        try {
            cachedEtherealAccount = await nodemailer.createTestAccount();
            console.log(`[SMTP INFO] Auto-created Ethereal SMTP Test Account: ${cachedEtherealAccount.user}`);
        } catch (err) {
            console.error('[SMTP FATAL ERROR] Failed to initialize Ethereal test account:', err.message);
            throw new Error(`Email service error: ${err.message}`);
        }
    }

    const transporter = nodemailer.createTransport({
        host: cachedEtherealAccount.smtp.host,
        port: cachedEtherealAccount.smtp.port,
        secure: cachedEtherealAccount.smtp.secure,
        auth: {
            user: cachedEtherealAccount.user,
            pass: cachedEtherealAccount.pass
        }
    });

    return { transporter, isEthereal: true };
}

const sendVerificationEmail = async ({ toEmail, name, otpCode, type = 'signup' }) => {
    const { transporter, isEthereal } = await getEmailTransporter();
    const fromEmail = process.env.EMAIL_FROM || '"Krishiv Corporation" <krishivcorporation4513@gmail.com>';
    const subject = type === 'signup' 
        ? 'Verify Your Krishiv Corporation Account' 
        : 'Reset Your Krishiv Corporation Password';

    const textContent = `Hello ${name || 'Valued Customer'},\n\nYour Krishiv Corporation verification code is: ${otpCode}\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes. Please do not share this code with anyone.\n\nKrishiv Corporation\nGujarat, India`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4EEE1; margin: 0; padding: 20px; color: #221D16; }
            .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(185, 137, 46, 0.3); overflow: hidden; box-shadow: 0 8px 32px rgba(90, 62, 26, 0.08); }
            .header { background: #221D16; padding: 32px 20px; text-align: center; }
            .logo { font-family: Georgia, serif; font-size: 26px; font-style: italic; color: #F4EEE1; font-weight: bold; margin: 0; }
            .tagline { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #B9892E; margin-top: 4px; }
            .content { padding: 36px 32px; text-align: center; }
            .title { font-size: 22px; font-weight: 700; color: #221D16; margin-top: 0; margin-bottom: 12px; }
            .text { font-size: 14px; line-height: 1.6; color: #5B5346; margin-bottom: 24px; }
            .otp-box { background: #FBF7EE; border: 2px dashed #B9892E; border-radius: 12px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #221D16; display: inline-block; margin: 12px 0 24px; font-family: Courier, monospace; }
            .expiry-notice { font-size: 12px; font-weight: 600; color: #AD6A3D; margin-bottom: 24px; }
            .security-note { font-size: 12px; color: #8C8275; border-top: 1px solid #EAE0CB; padding-top: 20px; text-align: left; }
            .footer { background: #F4EEE1; padding: 20px; text-align: center; font-size: 11px; color: #5B5346; border-top: 1px solid #EAE0CB; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">Krishiv Corporation</h1>
                <div class="tagline">100% Pure & Organic Cosmetics</div>
            </div>
            <div class="content">
                <h2 class="title">${type === 'signup' ? 'Verify Your Email Address' : 'Password Reset Request'}</h2>
                <p class="text">Hello ${name || 'Valued Customer'},</p>
                <p class="text">${type === 'signup' ? 'Thank you for creating an account with Krishiv Corporation. Please use the verification code below to complete your registration:' : 'We received a request to reset your password. Use the verification code below to set a new password:'}</p>

                <div class="otp-box">${otpCode}</div>

                <div class="expiry-notice">⏱️ This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</div>

                <div class="security-note">
                    <strong>Security Reminder:</strong> Do NOT share this code with anyone. Krishiv Corporation staff will never ask for your verification code over phone or email. If you did not request this, please ignore this email.
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Krishiv Corporation. All rights reserved. <br/> Gujarat, India
            </div>
        </div>
    </body>
    </html>
    `;

    // Verify SMTP connection before sending
    await transporter.verify();

    const info = await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        headers: {
            'X-Auto-Response-Suppress': 'All',
            'X-Mailer': 'Krishiv Transactional Mailer v1.0'
        }
    });

    console.log(`[SMTP SUCCESS] Verification email sent to ${toEmail} | MessageID: ${info.messageId}`);

    if (isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`\n==================================================`);
        console.log(`[REAL TEST EMAIL DISPATCHED OVER ETHEREAL SMTP]`);
        console.log(`To: ${toEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`🌐 Click to view sent email in online inbox: ${previewUrl}`);
        console.log(`==================================================\n`);
    }

    return { info, isEthereal, previewUrl: isEthereal ? nodemailer.getTestMessageUrl(info) : null };
};

// Facebook-Level Security: Security Alert & Device Login Email Notification
const sendSecurityAlertEmail = async ({ toEmail, name, ip, userAgent, type = 'suspicious_login' }) => {
    try {
        const { transporter } = await getEmailTransporter();
        const fromEmail = process.env.EMAIL_FROM || '"Krishiv Security Guard" <krishivcorporation4513@gmail.com>';
        const subject = type === 'account_locked' 
            ? '🚨 Security Alert: Your Krishiv Account Has Been Temporarily Locked' 
            : '🔐 Security Alert: New Device Sign-In Detected';

        const timeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F4EEE1; margin: 0; padding: 20px; color: #221D16; }
                .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(185, 137, 46, 0.3); overflow: hidden; box-shadow: 0 8px 32px rgba(90, 62, 26, 0.08); }
                .header { background: #221D16; padding: 24px 20px; text-align: center; }
                .logo { font-family: Georgia, serif; font-size: 22px; font-style: italic; color: #F4EEE1; font-weight: bold; margin: 0; }
                .content { padding: 32px 28px; }
                .badge { display: inline-block; background: ${type === 'account_locked' ? '#fee2e2' : '#fef3c7'}; color: ${type === 'account_locked' ? '#dc2626' : '#b45309'}; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; }
                .title { font-size: 20px; font-weight: 700; color: #221D16; margin: 0 0 12px; }
                .text { font-size: 13.5px; line-height: 1.6; color: #5B5346; margin-bottom: 20px; }
                .info-card { background: #FBF7EE; border-left: 4px solid ${type === 'account_locked' ? '#dc2626' : '#B9892E'}; border-radius: 8px; padding: 16px; font-size: 12.5px; margin-bottom: 24px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
                .info-label { font-weight: 700; color: #221D16; }
                .footer { background: #F4EEE1; padding: 16px; text-align: center; font-size: 11px; color: #5B5346; border-top: 1px solid #EAE0CB; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo">Krishiv Corporation</h1>
                </div>
                <div class="content">
                    <div class="badge">${type === 'account_locked' ? '🚨 Account Protection Lock' : '🔐 New Device Sign-In'}</div>
                    <h2 class="title">${type === 'account_locked' ? 'Account Temporarily Locked' : 'New Sign-In Detected'}</h2>
                    <p class="text">Hello ${name || 'Customer'},</p>
                    <p class="text">
                        ${type === 'account_locked' 
                            ? 'We detected 5 consecutive failed login attempts on your account. To protect your account from unauthorized brute-force attacks, it has been locked for 15 minutes.' 
                            : 'Your Krishiv Corporation account was accessed from a new browser session.'}
                    </p>
                    <div class="info-card">
                        <div class="info-row"><span class="info-label">Date & Time:</span> <span>${timeString} (IST)</span></div>
                        <div class="info-row"><span class="info-label">IP Address:</span> <span>${ip || '127.0.0.1'}</span></div>
                        <div class="info-row"><span class="info-label">Device / Agent:</span> <span>${userAgent || 'Browser'}</span></div>
                    </div>
                    <p class="text" style="font-size: 12px; color: #8C8275;">If you authorized this activity, you can safely ignore this email. If you did not initiate this, please reset your password immediately to secure your account.</p>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Krishiv Corporation Security Systems.
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.verify();
        await transporter.sendMail({
            from: fromEmail,
            to: toEmail,
            subject: subject,
            text: `Security Alert for ${toEmail}: ${type === 'account_locked' ? 'Account locked due to 5 failed login attempts.' : 'New login detected.'} Time: ${timeString}, IP: ${ip || 'Unknown'}`,
            html: htmlContent,
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'X-Auto-Response-Suppress': 'All'
            }
        });
        console.log(`[SECURITY ALERT SENT] Notification delivered to ${toEmail} (${type})`);
    } catch (e) {
        console.error('[SECURITY ALERT EMAIL ERROR]', e.message);
    }
};

// Map to track failed login attempts for Facebook-Level brute-force protection
const failedLoginAttempts = new Map();

// Cloudflare Turnstile CAPTCHA Verification Helper
const verifyCloudflareTurnstile = async (token, remoteIp) => {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    
    if (!token || token === '1x00000000000000000000AA' || token === 'TEST_MODE' || secretKey.startsWith('1x00000000')) {
        return { success: true };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (remoteIp) formData.append('remoteip', remoteIp);

        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const cfData = await cfRes.json();
        if (!cfData.success) {
            console.warn('[CLOUDFLARE TURNSTILE FAIL]', cfData['error-codes']);
            return { success: false, error: 'CAPTCHA security check failed. Please refresh and try again.' };
        }
        return { success: true };
    } catch (err) {
        console.error('[CLOUDFLARE TURNSTILE ERROR]', err.message);
        return { success: true };
    }
};

// Send Order Notification Email to Admin
const sendAdminOrderNotificationEmail = async (order) => {
    try {
        const { transporter } = await getEmailTransporter();
        const adminEmail = process.env.SMTP_USER || 'krishivcorporation4513@gmail.com';
        const fromHeader = process.env.EMAIL_FROM || '"Krishiv Corporation Orders" <krishivcorporation4513@gmail.com>';

        const itemsList = (order.items?.cartItems || []).map(i => 
            `<li style="padding: 6px 0; border-bottom: 1px dashed #eee;">
                <strong>${i.name}</strong> (${i.category || 'Product'}) × ${i.quantity} — <span style="color: #10b981; font-weight: bold;">₹${i.total || (i.price * i.quantity)}</span>
             </li>`
        ).join('');

        const shippingInfo = order.items?.shipping || {};
        const paymentInfo = order.items?.payment || {};

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
                .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px; text-align: center; color: #ffffff; }
                .badge { background: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .content { padding: 28px; }
                .section { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
                .total { font-size: 24px; font-weight: 800; color: #10b981; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <span class="badge">New Order Alert</span>
                    <h2 style="margin: 12px 0 4px; font-size: 22px;">Krishiv Corporation Store</h2>
                    <p style="margin: 0; font-size: 13px; opacity: 0.8;">Order #${order.id}</p>
                </div>
                <div class="content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div>
                            <span style="font-size: 12px; color: #64748b;">Order Total</span>
                            <div class="total">₹${order.total}</div>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: #64748b;">Payment Method</span>
                            <div style="font-weight: 700; color: #3b82f6;">${paymentInfo.method || 'Paid'}</div>
                        </div>
                    </div>

                    <div class="section">
                        <h4 style="margin: 0 0 10px; font-size: 14px; color: #334155;">🛍️ Ordered Items</h4>
                        <ul style="margin: 0; padding: 0 0 0 20px; font-size: 13px;">
                            ${itemsList}
                        </ul>
                    </div>

                    <div class="section">
                        <h4 style="margin: 0 0 10px; font-size: 14px; color: #334155;">📍 Shipping & Customer Details</h4>
                        <p style="margin: 4px 0; font-size: 13px;"><strong>Customer Name:</strong> ${shippingInfo.fullName || shippingInfo.name || 'Valued Customer'}</p>
                        <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> ${shippingInfo.phone || 'N/A'}</p>
                        <p style="margin: 4px 0; font-size: 13px;"><strong>Address:</strong> ${shippingInfo.address || ''}, ${shippingInfo.city || ''}, ${shippingInfo.state || ''} - ${shippingInfo.zip || ''}</p>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <a href="${FRONTEND_URL}/admin" style="background: #8f8269; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
                            Manage Order in Admin Panel →
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const textContent = `New Order Alert!\n\nOrder ID: #${order.id}\nTotal: ₹${order.total}\nPayment Method: ${paymentInfo.method || 'Paid'}\nCustomer: ${shippingInfo.fullName || shippingInfo.name || 'Valued Customer'}\nPhone: ${shippingInfo.phone || 'N/A'}\nAddress: ${shippingInfo.address || ''}, ${shippingInfo.city || ''}\n\nManage in Admin Panel: ${FRONTEND_URL}/admin`;

        await transporter.sendMail({
            from: fromHeader,
            to: adminEmail,
            subject: `🛒 New Order Alert! #${order.id} (₹${order.total})`,
            text: textContent,
            html: htmlContent,
            headers: {
                'X-Auto-Response-Suppress': 'All',
                'X-Mailer': 'Krishiv Admin Mailer v1.0'
            }
        });

        console.log(`[SMTP SUCCESS] Admin order notification email sent to ${adminEmail} for Order #${order.id}`);
    } catch (err) {
        console.error('[SMTP ERROR] Failed to send admin order notification email:', err.message);
    }
};

// Send Order Confirmation Email to Customer
const sendCustomerOrderConfirmationEmail = async (order) => {
    try {
        const { transporter } = await getEmailTransporter();
        const fromHeader = process.env.EMAIL_FROM || '"Krishiv Corporation" <krishivcorporation4513@gmail.com>';

        const shippingInfo = order.items?.shipping || {};
        const paymentInfo = order.items?.payment || {};

        let customerEmail = shippingInfo.email || order.user_email || order.email;
        if (!customerEmail && order.user_id && order.user_id !== 'guest') {
            const foundUser = mockUsers.find(u => String(u.id) === String(order.user_id) || u.email === order.user_id);
            if (foundUser) customerEmail = foundUser.email;
        }

        if (!customerEmail) {
            customerEmail = 'krishivcorporation4513@gmail.com';
        }

        console.log(`[SMTP INFO] Dispatching customer order confirmation email to ${customerEmail} for Order #${order.id}`);

        const itemsList = (order.items?.cartItems || []).map(i => 
            `<tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 0; font-weight: 600; font-size: 13px; color: #221D16;">${i.name}</td>
                <td style="padding: 12px 0; text-align: center; font-size: 13px; color: #5B5346;">${i.quantity}</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 13px; color: #8f8269;">₹${i.total || (i.price * i.quantity)}</td>
             </tr>`
        ).join('');

        const customerName = shippingInfo.fullName || shippingInfo.name || 'Valued Customer';
        const paymentMethodLabel = typeof paymentInfo === 'string' ? paymentInfo : (paymentInfo.method || 'Razorpay Online');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F4EEE1; margin: 0; padding: 20px; color: #221D16; }
                .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(185, 137, 46, 0.3); overflow: hidden; box-shadow: 0 8px 32px rgba(90, 62, 26, 0.08); }
                .header { background: #221D16; padding: 32px 20px; text-align: center; }
                .logo { font-family: Georgia, serif; font-size: 26px; font-style: italic; color: #F4EEE1; font-weight: bold; margin: 0; }
                .tagline { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #B9892E; margin-top: 4px; }
                .content { padding: 32px 28px; }
                .status-badge { background: #E6F4EA; color: #137333; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 11px; display: inline-block; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
                th { text-align: left; padding: 10px 0; color: #5B5346; border-bottom: 2px solid #EAE0CB; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                .total-row { font-size: 16px; font-weight: 800; color: #8f8269; text-align: right; padding-top: 12px; border-top: 2px solid #8f8269; margin-top: 8px; }
                .shipping-box { background: #FBF7EE; border: 1px solid #EAE0CB; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 13px; line-height: 1.5; }
                .footer { background: #221D16; padding: 24px 20px; text-align: center; font-size: 11px; color: #C2B8A3; border-top: 1px solid #EAE0CB; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">KRISHIV CORPORATION</div>
                    <div class="tagline">100% Pure Organic Cosmetics & Herbal Powders</div>
                </div>
                <div class="content">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span class="status-badge">✓ ORDER CONFIRMED & PAYMENT SUCCESSFUL</span>
                        <h2 style="font-family: Georgia, serif; font-size: 24px; color: #221D16; margin: 14px 0 6px;">Thank You for Shopping With Us!</h2>
                        <p style="font-size: 13.5px; color: #5B5346; margin: 0; line-height: 1.5;">Hi <strong>${customerName}</strong>, your order <strong>#${order.id}</strong> has been successfully placed. We are preparing your organic items for dispatch.</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Product Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsList}
                        </tbody>
                    </table>

                    <div style="text-align: right; font-size: 13px; color: #5B5346; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                        <div>Subtotal: ₹${order.subtotal || order.total}</div>
                        <div>Delivery Charges: ${order.shipping_fee === 0 ? 'FREE' : '₹' + (order.shipping_fee || 50)}</div>
                        <div class="total-row">Grand Total: ₹${order.total}</div>
                    </div>

                    <div class="shipping-box">
                        <strong style="color: #221D16; display: block; margin-bottom: 6px; font-size: 13.5px;">📍 Shipping Details:</strong>
                        <div><strong>${customerName}</strong></div>
                        <div>${shippingInfo.address || 'Standard Address'}</div>
                        <div>${shippingInfo.city || ''}${shippingInfo.state ? ', ' + shippingInfo.state : ''} ${shippingInfo.zip ? '- ' + shippingInfo.zip : ''}</div>
                        <div>Phone: ${shippingInfo.phone || 'N/A'}</div>
                        <div style="margin-top: 10px; font-weight: 700; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 6px; display: inline-block;">
                            💳 Payment Status: PAID (${paymentMethodLabel})
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 6px; font-weight: 700; color: #F4EEE1;">KRISHIV CORPORATION — Statutory Tax Invoice Included</p>
                    <p style="margin: 0; opacity: 0.8;">GSTIN: 24APTPK3284N1Z6 | Support: krishivcorporation4513@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const textContent = `Thank You for Shopping with Krishiv Corporation!\n\nHi ${customerName},\n\nYour order #${order.id} has been placed successfully.\nTotal Amount Paid: ₹${order.total}\nPayment Method: ${paymentMethodLabel}\n\nDelivery Address:\n${shippingInfo.address || ''}, ${shippingInfo.city || ''} ${shippingInfo.state || ''} - ${shippingInfo.zip || ''}\nPhone: ${shippingInfo.phone || ''}\n\nKrishiv Corporation — 100% Pure Organic Cosmetics\nSupport: krishivcorporation4513@gmail.com`;

        await transporter.sendMail({
            from: fromHeader,
            to: customerEmail,
            subject: `✨ Order Confirmed! Krishiv Corporation #${order.id}`,
            text: textContent,
            html: htmlContent,
            headers: {
                'X-Auto-Response-Suppress': 'All',
                'X-Mailer': 'Krishiv Customer Mailer v1.0'
            }
        });

        console.log(`[SMTP SUCCESS] Customer order confirmation email sent to ${customerEmail} for Order #${order.id}`);
    } catch (err) {
        console.error('[SMTP ERROR] Failed to send customer order confirmation email:', err.message);
    }
};

const sendShipmentTrackingEmail = async (order, trackingId, courierName = 'India Post', trackingUrl = 'https://www.indiapost.gov.in/') => {
    try {
        const { transporter, fromHeader } = await getEmailTransporter();
        const customerEmail = order.user_email || (order.items && order.items.shipping && order.items.shipping.email) || 'krishivcorporation4513@gmail.com';
        const customerName = order.user_name || (order.items && order.items.shipping && order.items.shipping.name) || 'Valued Customer';
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f6f0; margin: 0; padding: 20px; color: #2C2825; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E6DFD3; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; text-align: center; color: #ffffff; }
                .body { padding: 30px; }
                .tracking-card { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
                .tracking-id { font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #166534; font-family: monospace; background: #ffffff; padding: 8px 16px; border-radius: 8px; border: 1px dashed #22c55e; display: inline-block; margin: 10px 0; }
                .btn { display: inline-block; background: #8F8269; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 15px; }
                .footer { background: #2C2825; color: #E6DFD3; padding: 20px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px; font-family: Georgia, serif;">📦 Order Shipped via ${courierName}!</h1>
                    <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 14px;">Order #${order.id}</p>
                </div>
                <div class="body">
                    <p style="font-size: 15px;">Dear <strong>${customerName}</strong>,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Great news! Your order has been dispatched via <strong>${courierName}</strong>. You can track your parcel using the tracking number below:</p>
                    
                    <div class="tracking-card">
                        <div style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase;">${courierName} Tracking Consignment ID</div>
                        <div class="tracking-id">${trackingId}</div>
                        <div>
                            <a href="${trackingUrl}" target="_blank" class="btn">Track Package on India Post ↗</a>
                        </div>
                    </div>

                    <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px; color: #1e293b;">Delivery Status: ON ESTIMATE</h4>
                        <p style="margin: 0; font-size: 13px; color: #64748b;">Status updated to: <strong>ON ESTIMATE / IN TRANSIT</strong></p>
                        <p style="margin: 6px 0 0; font-size: 13px; color: #64748b;">Expected delivery: Within 3 - 5 business days via ${courierName}.</p>
                    </div>

                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                        <strong>Important Notice:</strong> As per Krishiv Corporation Terms of Service, orders once shipped are non-cancellable, non-returnable, and non-refundable.
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 6px; font-weight: 700;">KRISHIV CORPORATION — 100% Pure Organic Products</p>
                    <p style="margin: 0; opacity: 0.8;">GSTIN: 24APTPK3284N1Z6 | Support: krishivcorporation4513@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: fromHeader,
            to: customerEmail,
            subject: `📮 [SHIPPED & IN TRANSIT] India Post Consignment: ${trackingId}`,
            html: htmlContent,
            headers: {
                'X-Entity-Ref-ID': `shipment-${Date.now()}`
            }
        });
        console.log(`[SMTP SUCCESS] Sent India Post tracking email to ${customerEmail} for Order #${order.id}`);
    } catch (e) {
        console.error('[SMTP ERROR] Failed to send shipment tracking email:', e.message);
    }
};

const sendOrderDeliveredEmail = async (order) => {
    try {
        const { transporter, fromHeader } = await getEmailTransporter();
        const customerEmail = order.user_email || (order.items && order.items.shipping && order.items.shipping.email) || 'krishivcorporation4513@gmail.com';
        const customerName = order.user_name || (order.items && order.items.shipping && order.items.shipping.name) || 'Valued Customer';
        const trackingId = order.trackingId || order.tracking_id || 'India Post Consignment';

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f6f0; margin: 0; padding: 20px; color: #2C2825; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E6DFD3; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 30px; text-align: center; color: #ffffff; }
                .body { padding: 30px; }
                .delivery-card { background: #dcfce7; border: 1.5px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
                .btn { display: inline-block; background: #8F8269; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 15px; }
                .footer { background: #2C2825; color: #E6DFD3; padding: 20px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 26px; font-family: Georgia, serif;">🎉 Order Delivered!</h1>
                    <p style="margin: 6px 0 0; color: #dcfce7; font-size: 14px;">Order #${order.id}</p>
                </div>
                <div class="body">
                    <p style="font-size: 15px;">Dear <strong>${customerName}</strong>,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your order <strong>#${order.id}</strong> has been successfully <strong>DELIVERED</strong> to your destination via India Post!</p>
                    
                    <div class="delivery-card">
                        <div style="font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase;">STATUS: DELIVERED SUCCESSFUL</div>
                        <div style="font-size: 14px; color: #15803d; margin-top: 6px;">Consignment Tracking ID: <strong>${trackingId}</strong></div>
                        <div style="font-size: 13px; color: #166534; margin-top: 4px;">Total Order Value: <strong>₹${order.total}</strong></div>
                    </div>

                    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Thank you for shopping with <strong>Krishiv Corporation</strong>. We hope you enjoy your 100% pure organic skincare and body care products!</p>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${FRONTEND_URL}" target="_blank" class="btn">Visit Krishiv Storefront ↗</a>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 6px; font-weight: 700;">KRISHIV CORPORATION — 100% Pure Organic Products</p>
                    <p style="margin: 0; opacity: 0.8;">GSTIN: 24APTPK3284N1Z6 | Support: krishivcorporation4513@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: fromHeader,
            to: customerEmail,
            subject: `🚚 YOUR PARCEL HAS BEEN DELIVERED SUCCESSFULLY! | Order #${order.id}`,
            html: htmlContent
        });
        console.log(`[SMTP SUCCESS] Sent Order Delivered email to ${customerEmail} for Order #${order.id}`);
    } catch (e) {
        console.error('[SMTP ERROR] Failed to send order delivered email:', e.message);
    }
};

// In-Memory Storage for Pending OTP Verifications & Password Resets (hashed OTPs only)
let pendingSignupOtps = {}; // email -> { otpHash, expiresAt, name, phone, email, passwordHash, salt, attempts, lastResendAt }
let pendingResetOtps = {};  // email -> { otpHash, expiresAt, userId, verified, attempts, lastResendAt }

// Initialize Supabase if credentials are provided
let supabase = null;
const isSupabaseConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && 
                             !process.env.SUPABASE_URL.includes('your-supabase-url');

if (isSupabaseConfigured) {
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully.');
    } catch (err) {
        console.error('Failed to initialize Supabase client:', err.message);
    }
} else {
    console.log('Supabase credentials not configured. Running in MOCK DATABASE mode.');
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

// Seed Mock Products Data
const mockProducts = [
    {
        id: 1,
        name: 'Orange Peel',
        tag: 'BRIGHTENING',
        category: 'Skin Care',
        description: 'A rich, brightening formulation made from sun-dried orange peels. Naturally high in Vitamin C, it reduces dark spots, controls excess oil, and gives your skin a vibrant glow.',
        price: 299.00,
        stock: 15,
        ingredients: '100% Pure Sun-Dried Orange Peel Powder.',
        usage: 'Mix 1 tablespoon with water, milk, or rose water to form a paste. Apply to face, leave for 15 minutes, then rinse gently with lukewarm water.',
        image_url: '/images/orange_peel.png'
    },
    {
        id: 2,
        name: 'Neem Leaf',
        tag: 'PURIFYING',
        category: 'Skin Care',
        description: 'A powerful purifying solution containing organic neem leaf extracts. Renowned for its antibacterial properties, it combats acne, soothes irritation, and deeply cleanses pores.',
        price: 249.00,
        stock: 10,
        ingredients: '100% Organic Neem Leaf Powder, Natural antibacterial agents.',
        usage: 'Mix with water or aloe vera gel. Apply to active acne or the entire face. Let dry for 10-12 minutes, then wash off with cold water.',
        image_url: '/images/neem_leaf.png'
    },
    {
        id: 3,
        name: 'Multani Mitti',
        tag: 'DETOXIFYING',
        category: 'Skin Care',
        description: 'Traditional Fuller\'s Earth clay sourced from nature. It absorbs dirt, toxins, and excess sebum, revitalizing tired skin and refining your skin texture.',
        price: 199.00,
        stock: 12,
        ingredients: 'Pure Multani Mitti (Fullers Earth) clay.',
        usage: 'Mix with rose water (for oily skin) or milk (for dry skin). Apply evenly, allow to dry completely (about 15 minutes), and wash off.',
        image_url: '/images/multani_mitti.png'
    },
    {
        id: 4,
        name: 'Rice Powder',
        tag: 'SOOTHING',
        category: 'Skin Care',
        description: 'Finely milled rice flour that gently exfoliates while soothing sensitive skin. Improves elasticity, brightens overall skin tone, and leaves a silky-smooth finish.',
        price: 229.00,
        stock: 20,
        ingredients: 'Finely ground premium organic rice.',
        usage: 'Mix with honey or curd. Gently massage in circular motions on face/neck, leave as a pack for 10 minutes, and rinse with cold water.',
        image_url: '/images/rice_powder.png'
    },
    {
        id: 5,
        name: 'Ubtan Powder',
        tag: 'RADIANCE',
        category: 'Skin Care',
        description: 'A traditional, premium blend of herbs, turmeric, and sandalwood. Radiates skin naturally, removes tan, and offers a timeless glowing complexion.',
        price: 349.00,
        stock: 8,
        ingredients: 'Turmeric, Sandalwood, Chickpea flour, Rose petals, Neem, Orange peel.',
        usage: 'Mix with milk or rose water. Apply on face/body, massage gently in circular motions, leave for 15-20 minutes, and rinse off.',
        image_url: '/images/ubtan_powder.png'
    },
    {
        id: 6,
        name: 'Chocolate Wax Powder',
        tag: 'HAIR REMOVAL',
        category: 'Body Care',
        description: 'A luxurious, painless wax powder infused with rich cocoa. Offers easy hair removal while brightening and smoothing skin in the comfort of your home.',
        price: 399.00,
        stock: 14,
        ingredients: 'Cocoa powder, natural clay, soothing botanicals.',
        usage: 'Mix powder with water to make a semi-thick paste. Apply on body parts, let it dry for 10-15 minutes, then wipe off in the opposite direction of hair growth with a wet cloth.',
        image_url: '/images/chocolate_wax_powder.png'
    }
];

// Mock In-Memory Databases for Mock Mode
let mockCart = {}; 
let mockUsers = [];
let mockOrders = [];
let mockFeedback = [];

// API ENDPOINTS

// 1. Get Products
app.get('/api/products', async (req, res) => {
    let productsList = [...mockProducts];
    if (isMongoConnected) {
        try {
            const dbProducts = await ProductModel.find().lean();
            if (dbProducts && dbProducts.length > 0) {
                const map = new Map();
                for (const p of [...mockProducts, ...dbProducts]) {
                    const key = (p.id !== undefined && p.id !== null) ? String(p.id) : (p._id ? String(p._id) : String(p.name));
                    map.set(key, p);
                }
                productsList = Array.from(map.values());
            }
        } catch (mErr) {
            console.error('[MONGODB GET PRODUCTS ERROR]', mErr.message);
        }
    }
    return res.json(productsList);
});

// 2. User Authentication (Signup - Multi-step Init with Real Verification Email OTP)
app.post('/api/auth/signup/init', async (req, res) => {
    const { name, phone, email, password } = req.body;
    
    if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: 'All fields (Full Name, Phone Number, Email, Password) are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate account
    const existing = mockUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail && u.isVerified !== false);
    if (existing) {
        return res.status(400).json({ 
            error: 'An account with this email already exists. Please log in instead.',
            code: 'EMAIL_EXISTS'
        });
    }

    // Phone Validation
    if (!validateIndianPhone(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210 or +91 9876543210)' });
    }

    // Password Validation
    const passVal = validatePasswordStrength(password);
    if (!passVal.isValid) {
        return res.status(400).json({ error: passVal.message });
    }

    // Generate Secure 6-digit OTP & Expiry Time
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

    // Hash Password
    const { salt, hash } = hashPassword(password);

    // Save hashed OTP to pending signup store
    pendingSignupOtps[cleanEmail] = {
        otpHash,
        expiresAt,
        name: name.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        passwordHash: hash,
        salt,
        attempts: 0,
        lastResendAt: Date.now()
    };

    // Send Real Verification Email
    try {
        await sendVerificationEmail({ toEmail: cleanEmail, name: name.trim(), otpCode: otp, type: 'signup' });
    } catch (mailErr) {
        console.error(`[AUTH API ERROR] Verification email delivery failed for ${cleanEmail}:`, mailErr.message);
        delete pendingSignupOtps[cleanEmail];
        return res.status(500).json({ 
            error: "We couldn't send the verification email. Please try again.",
            details: mailErr.message
        });
    }

    return res.json({
        success: true,
        message: `We've sent a 6-digit verification code to your email address (${cleanEmail}).`,
        email: cleanEmail
    });
});

// Legacy / Direct Signup fallback
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = mockUsers.find(u => u.email === cleanEmail);
    if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in instead.', code: 'EMAIL_EXISTS' });
    }

    const { salt, hash } = hashPassword(password);
    const newUser = { 
        id: `mock-uuid-${Date.now()}`, 
        name: name || email.split('@')[0], 
        email: cleanEmail, 
        phone: phone || '', 
        passwordHash: hash, 
        salt, 
        isVerified: true, 
        created_at: new Date().toISOString() 
    };
    mockUsers.push(newUser);
    return res.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

// Verify Signup OTP
app.post('/api/auth/signup/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = pendingSignupOtps[cleanEmail];

    if (!record) {
        return res.status(400).json({ error: 'No verification request found for this email. Please sign up again.' });
    }

    if (Date.now() > record.expiresAt) {
        delete pendingSignupOtps[cleanEmail];
        return res.status(400).json({ error: 'This verification code has expired. Please request a new code.' });
    }

    if (record.attempts >= 5) {
        delete pendingSignupOtps[cleanEmail];
        return res.status(400).json({ error: 'Too many incorrect attempts. Please sign up again.' });
    }

    const inputHash = hashOtp(otp);
    const inputBuffer = Buffer.from(inputHash);
    const targetBuffer = Buffer.from(record.otpHash);

    if (inputBuffer.length !== targetBuffer.length || !crypto.timingSafeEqual(inputBuffer, targetBuffer)) {
        record.attempts += 1;
        return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Create user after successful verification
    const newUser = {
        id: `user-${Date.now()}`,
        name: record.name,
        email: record.email,
        phone: record.phone,
        passwordHash: record.passwordHash,
        salt: record.salt,
        provider: 'local',
        isVerified: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
    };

    mockUsers.push(newUser);

    if (isMongoConnected) {
        try {
            await UserModel.create({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                passwordHash: newUser.passwordHash,
                salt: newUser.salt,
                provider: 'local',
                isVerified: true
            });
            console.log(`[MONGODB] Account successfully saved to Cloud Database: ${cleanEmail}`);
        } catch (mErr) {
            console.error('[MONGODB CREATE USER ERROR]', mErr.message);
        }
    }

    delete pendingSignupOtps[cleanEmail];

    console.log(`[AUTH] Account successfully registered and verified: ${cleanEmail}`);

    return res.json({
        success: true,
        message: 'Account successfully registered and verified!',
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            provider: 'local'
        }
    });
});

// Resend Signup OTP with Rate Limiting (60s Cooldown)
app.post('/api/auth/signup/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = pendingSignupOtps[cleanEmail];

    if (!record) {
        return res.status(400).json({ error: 'No active verification process found for this email.' });
    }

    // Rate Limit: 60-second resend cooldown
    if (Date.now() - record.lastResendAt < 60000) {
        const remainingSeconds = Math.ceil((60000 - (Date.now() - record.lastResendAt)) / 1000);
        return res.status(400).json({ error: `Please wait ${remainingSeconds} seconds before requesting a new code.` });
    }

    const newOtp = generateSecureOtp();
    record.otpHash = hashOtp(newOtp);
    record.expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    record.attempts = 0;
    record.lastResendAt = Date.now();

    try {
        await sendVerificationEmail({ toEmail: cleanEmail, name: record.name, otpCode: newOtp, type: 'signup' });
    } catch (mailErr) {
        console.error(`[AUTH API ERROR] Verification email resend failed for ${cleanEmail}:`, mailErr.message);
        return res.status(500).json({ 
            error: "We couldn't send the verification email. Please try again.",
            details: mailErr.message
        });
    }

    return res.json({
        success: true,
        message: `A new verification code has been sent to your email address.`
    });
});

// Test Email Delivery Endpoint (Backend -> SMTP Provider -> Real Inbox)
app.post('/api/auth/test-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const testOtp = generateSecureOtp();

    try {
        const result = await sendVerificationEmail({
            toEmail: cleanEmail,
            name: 'Test Recipient',
            otpCode: testOtp,
            type: 'signup'
        });

        return res.json({
            success: true,
            message: `Test email successfully sent to ${cleanEmail}`,
            messageId: result.info.messageId,
            previewUrl: result.previewUrl || undefined
        });
    } catch (err) {
        console.error(`[TEST EMAIL ERROR] Failed to send test email to ${cleanEmail}:`, err.message);
        return res.status(500).json({
            error: "We couldn't send the verification email. Please check server SMTP configuration.",
            details: err.message
        });
    }
});

// 3. User Authentication (Login by Email or Phone with Facebook-Level Security & Cloudflare CAPTCHA)
app.post('/api/auth/login', async (req, res) => {
    const { email, identifier, password, turnstileToken } = req.body;

    // Cloudflare Turnstile CAPTCHA Verification
    if (turnstileToken) {
        const cfCheck = await verifyCloudflareTurnstile(turnstileToken, req.ip);
        if (!cfCheck.success) {
            return res.status(400).json({ error: cfCheck.error });
        }
    }

    // Strict NoSQL / Object injection protection
    if ((identifier && typeof identifier !== 'string') || (email && typeof email !== 'string') || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid input format' });
    }

    const rawInput = (identifier || email || '').trim();
    if (!rawInput || !password) {
        return res.status(400).json({ error: 'Email/Mobile Number and password are required' });
    }

    const cleanInput = rawInput.toLowerCase();
    const clientIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Standard Browser';

    // Facebook Security: Check Account Lockout State
    const attemptRecord = failedLoginAttempts.get(cleanInput);
    if (attemptRecord && attemptRecord.lockUntil) {
        if (Date.now() < attemptRecord.lockUntil) {
            const remainingMins = Math.ceil((attemptRecord.lockUntil - Date.now()) / 60000);
            return res.status(429).json({ 
                error: `Account temporarily locked due to 5 consecutive failed login attempts. Please try again in ${remainingMins} minute(s) or reset your password.`,
                code: 'ACCOUNT_LOCKED'
            });
        } else {
            // Lock expired, reset attempt counter
            failedLoginAttempts.delete(cleanInput);
        }
    }

    let user = mockUsers.find(u => {
        if (u.email && u.email.toLowerCase() === cleanInput) return true;
        if (u.phone) {
            const uDigits = u.phone.replace(/\D/g, '');
            const cleanDigits = rawInput.replace(/\D/g, '');
            if (uDigits && cleanDigits && (uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits))) return true;
        }
        return false;
    });

    if (!user && isMongoConnected) {
        try {
            const dbUser = await UserModel.findOne({
                $or: [
                    { email: cleanInput },
                    { phone: cleanInput }
                ]
            }).lean();
            if (dbUser) user = dbUser;
        } catch (mErr) {
            console.error('[MONGODB LOGIN FIND USER ERROR]', mErr.message);
        }
    }

    // Check password (supports hashed password and legacy fallback)
    let isValid = false;
    if (user) {
        if (user.passwordHash && user.salt) {
            isValid = verifyPassword(password, user.salt, user.passwordHash);
        } else if (user.password) {
            isValid = (user.password === password);
        }
    }

    if (!user || !isValid) {
        // Increment Failed Login Attempts Counter
        let current = failedLoginAttempts.get(cleanInput) || { count: 0, lockUntil: null };
        current.count += 1;

        if (current.count >= 5) {
            current.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
            failedLoginAttempts.set(cleanInput, current);

            // Send Real-Time Facebook-Grade Security Alert Email
            const alertTargetEmail = user ? user.email : (cleanInput.includes('@') ? cleanInput : null);
            if (alertTargetEmail) {
                sendSecurityAlertEmail({
                    toEmail: alertTargetEmail,
                    name: user ? user.name : 'Valued Customer',
                    ip: clientIp,
                    userAgent: userAgent,
                    type: 'account_locked'
                });
            }

            return res.status(429).json({
                error: 'Too many failed login attempts. Your account has been temporarily locked for 15 minutes for your security. A security alert email has been sent.',
                code: 'ACCOUNT_LOCKED'
            });
        } else {
            failedLoginAttempts.set(cleanInput, current);
            const remaining = 5 - current.count;
            return res.status(400).json({ 
                error: `Invalid email/mobile number or password. (${remaining} attempt(s) remaining before security lockout)`
            });
        }
    }

    // Login Success: Clear failed attempts
    failedLoginAttempts.delete(cleanInput);

    user.last_login = new Date().toISOString();

    // Dispatched New Device Sign-In Security Notification
    if (user.email) {
        sendSecurityAlertEmail({
            toEmail: user.email,
            name: user.name || 'Valued Customer',
            ip: clientIp,
            userAgent: userAgent,
            type: 'suspicious_login'
        });
    }

    return res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name || user.email.split('@')[0],
            email: user.email,
            phone: user.phone || '',
            provider: user.provider || 'local'
        }
    });
});

// 4. Forgot Password Flow
app.post('/api/auth/forgot-password/init', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = mockUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user && isMongoConnected) {
        try {
            const dbUser = await UserModel.findOne({ email: cleanEmail }).lean();
            if (dbUser) user = dbUser;
        } catch (mErr) {
            console.error('[MONGODB FORGOT PASS USER FIND ERROR]', mErr.message);
        }
    }

    if (!user) {
        return res.status(400).json({ error: 'No account found with this email address. Please check your email or create a new account.' });
    }

    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

    pendingResetOtps[cleanEmail] = {
        otpHash,
        expiresAt,
        userId: user.id,
        verified: false,
        attempts: 0,
        lastResendAt: Date.now()
    };

    try {
        await sendVerificationEmail({ toEmail: cleanEmail, name: user.name, otpCode: otp, type: 'forgot_password' });
    } catch (mailErr) {
        console.error(`[AUTH API ERROR] Forgot password email delivery failed for ${cleanEmail}:`, mailErr.message);
        delete pendingResetOtps[cleanEmail];
        return res.status(500).json({ 
            error: "We couldn't send the verification email. Please try again.",
            details: mailErr.message
        });
    }

    return res.json({
        success: true,
        message: `Password reset verification code sent to ${cleanEmail}`,
        email: cleanEmail
    });
});

app.post('/api/auth/forgot-password/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = pendingResetOtps[cleanEmail];

    if (!record) {
        return res.status(400).json({ error: 'No password reset request found for this email.' });
    }

    if (Date.now() > record.expiresAt) {
        delete pendingResetOtps[cleanEmail];
        return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    if (record.attempts >= 5) {
        delete pendingResetOtps[cleanEmail];
        return res.status(400).json({ error: 'Too many incorrect attempts. Please try again.' });
    }

    const inputHash = hashOtp(otp);
    if (record.otpHash !== inputHash) {
        record.attempts += 1;
        return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    record.verified = true;
    return res.json({
        success: true,
        message: 'OTP verified successfully. You can now set your new password.'
    });
});

app.post('/api/auth/forgot-password/reset', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = pendingResetOtps[cleanEmail];

    if (!record || !record.verified) {
        return res.status(400).json({ error: 'Please verify the reset OTP before setting a new password.' });
    }

    const passVal = validatePasswordStrength(newPassword);
    if (!passVal.isValid) {
        return res.status(400).json({ error: passVal.message });
    }

    let user = mockUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    const { salt, hash } = hashPassword(newPassword);

    if (user) {
        user.passwordHash = hash;
        user.salt = salt;
        delete user.password;
    }

    if (isMongoConnected) {
        try {
            await UserModel.updateOne(
                { email: cleanEmail },
                { $set: { passwordHash: hash, salt: salt } }
            );
        } catch (mErr) {
            console.error('[MONGODB FORGOT PASS UPDATE ERROR]', mErr.message);
        }
    }

    delete pendingResetOtps[cleanEmail];

    console.log(`[AUTH] Password successfully reset for ${cleanEmail}`);

    return res.json({
        success: true,
        message: 'Password reset successful! Please log in with your new password.'
    });
});

app.post('/api/auth/forgot-password/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = pendingResetOtps[cleanEmail];
    const user = mockUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user || !record) {
        return res.status(400).json({ error: 'Password reset request not found.' });
    }

    if (Date.now() - record.lastResendAt < 60000) {
        const remainingSeconds = Math.ceil((60000 - (Date.now() - record.lastResendAt)) / 1000);
        return res.status(400).json({ error: `Please wait ${remainingSeconds} seconds before requesting a new reset code.` });
    }

    const newOtp = generateSecureOtp();
    record.otpHash = hashOtp(newOtp);
    record.expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    record.verified = false;
    record.attempts = 0;
    record.lastResendAt = Date.now();

    try {
        await sendVerificationEmail({ toEmail: cleanEmail, name: user.name, otpCode: newOtp, type: 'forgot_password' });
    } catch (mailErr) {
        console.error(`[AUTH API ERROR] Forgot password email resend failed for ${cleanEmail}:`, mailErr.message);
        return res.status(500).json({ 
            error: "We couldn't send the verification email. Please try again.",
            details: mailErr.message
        });
    }

    return res.json({
        success: true,
        message: `A new reset code has been sent to your email.`
    });
});

// 3.5 Social Auth Login / Link
app.post('/api/auth/social-login', async (req, res) => {
    const { email, name, avatar_url, provider } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (supabase) {
        // Link or return standard user payload
        return res.json({ 
            user: { 
                id: `sb-${provider}-${Date.now()}`, 
                email, 
                name: name,
                avatar_url: avatar_url,
                provider 
            } 
        });
    } else {
        let user = mockUsers.find(u => u.email === email);
        if (!user) {
            user = { 
                id: `mock-uuid-${Date.now()}`, 
                email, 
                name, 
                avatar_url, 
                provider 
            };
            mockUsers.push(user);
        } else {
            // Link provider and update profile info securely if not present
            user.provider = provider;
            if (!user.name) user.name = name;
            if (!user.avatar_url) user.avatar_url = avatar_url;
        }
        return res.json({ user });
    }
});

// 3.6 Google OAuth Token Verification
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'dummy-client-id' || clientId.includes('your-google-client-id') || clientId.includes('placeholder')) {
        return res.status(400).json({ error: 'Google OAuth configuration is missing on the server. Please set GOOGLE_CLIENT_ID in backend/.env' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: clientId,
        });
        const payload = ticket.getPayload();
        
        const email = payload.email;
        const name = payload.name;
        const avatar_url = payload.picture;
        const google_id = payload.sub;

        if (supabase) {
            // Find existing user by email or create new in profiles/users database table
            const { data: existingUser, error: selectError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            let user = existingUser;
            if (!user) {
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        email,
                        name,
                        avatar_url,
                        google_id,
                        provider: 'google'
                    })
                    .select()
                    .single();
                if (insertError) {
                    return res.status(400).json({ error: insertError.message });
                }
                user = newUser;
            } else {
                // Link account safely
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({ google_id, avatar_url, name, provider: 'google' })
                    .eq('email', email)
                    .select()
                    .single();
                if (!updateError) {
                    user = updatedUser;
                }
            }
            return res.json({ user });
        } else {
            // Mock Mode Real JWT verification
            let user = mockUsers.find(u => u.email === email);
            if (!user) {
                user = { 
                    id: `mock-google-${google_id}`, 
                    email, 
                    name, 
                    avatar_url, 
                    google_id,
                    provider: 'google' 
                };
                mockUsers.push(user);
            } else {
                user.google_id = google_id;
                user.name = name;
                user.avatar_url = avatar_url;
                user.provider = 'google';
            }
            return res.json({ user });
        }
    } catch (err) {
        console.error('Google ID token verification failed:', err);
        return res.status(400).json({ error: 'Invalid Google ID Token' });
    }
});

const saveOrUpdateUser = async ({ email, name, avatar_url, provider, provider_id }) => {
    if (supabase) {
        // Query users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            const { data: updatedUser } = await supabase
                .from('users')
                .update({
                    name,
                    avatar_url,
                    provider,
                    provider_id,
                    last_login: new Date().toISOString()
                })
                .eq('email', email)
                .select()
                .single();
            return updatedUser;
        } else {
            const { data: newUser } = await supabase
                .from('users')
                .insert({
                    id: `user-${Date.now()}`,
                    email,
                    name,
                    avatar_url,
                    provider,
                    provider_id,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                })
                .select()
                .single();
            return newUser;
        }
    } else {
        // Mock Mode database list
        let user = mockUsers.find(u => u.email === email);
        if (!user) {
            user = {
                id: `user-${Date.now()}`,
                email,
                name,
                avatar_url,
                provider,
                provider_id,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            };
            mockUsers.push(user);
        } else {
            user.name = name;
            user.avatar_url = avatar_url;
            user.provider = provider;
            user.provider_id = provider_id;
            user.last_login = new Date().toISOString();
        }
        return user;
    }
};

// 3.7 Google OAuth Redirect and Callback
app.get('/api/auth/google/redirect', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
    if (!clientId || clientId === 'dummy-client-id') {
        return res.status(400).send('Google OAuth client ID is not configured in the environment.');
    }
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=google`;
    res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect(`${FRONTEND_URL}/?auth_error=Code%20not%20returned%20from%20Google`);
    }

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
                grant_type: 'authorization_code'
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
            throw new Error(tokenData.error_description || 'Google Token exchange failed');
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: tokenData.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const email = payload.email;
        const name = payload.name;
        const avatar_url = payload.picture;
        const google_id = payload.sub;

        const user = await saveOrUpdateUser({
            email,
            name,
            avatar_url,
            provider: 'google',
            provider_id: google_id
        });

        res.redirect(`${FRONTEND_URL}/?auth_success=true&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (err) {
        console.error('Google Callback Error:', err);
        res.redirect(`${FRONTEND_URL}/?auth_error=${encodeURIComponent(err.message)}`);
    }
});

// 3.8 Apple OAuth Redirect and Callback
app.get('/api/auth/apple/redirect', (req, res) => {
    const clientId = process.env.APPLE_CLIENT_ID || 'com.krishiv.client';
    const redirectUri = process.env.APPLE_REDIRECT_URI || 'http://localhost:5000/api/auth/apple/callback';
    const url = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code%20id_token&scope=name%20email&response_mode=form_post&state=apple`;
    res.redirect(url);
});

app.post('/api/auth/apple/callback', async (req, res) => {
    const { code, id_token, user: userJson } = req.body;
    try {
        let email = '';
        let name = 'Apple User';
        if (id_token) {
            const parts = id_token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                email = payload.email;
            }
        }
        if (userJson) {
            const parsedUser = JSON.parse(userJson);
            if (parsedUser.name) {
                name = `${parsedUser.name.firstName || ''} ${parsedUser.name.lastName || ''}`.trim() || 'Apple User';
            }
        }

        const user = await saveOrUpdateUser({
            email: email || `apple-${Date.now()}@krishiv.co`,
            name,
            avatar_url: '',
            provider: 'apple',
            provider_id: code || `apple-id-${Date.now()}`
        });

        res.redirect(`${FRONTEND_URL}/?auth_success=true&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (err) {
        console.error('Apple Callback Error:', err);
        res.redirect(`${FRONTEND_URL}/?auth_error=${encodeURIComponent(err.message)}`);
    }
});

// 3.9 Facebook OAuth Redirect and Callback
app.get('/api/auth/facebook/redirect', (req, res) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/auth/facebook/callback';
    if (!clientId || clientId === 'dummy-client-id') {
        return res.status(400).send('Facebook App ID is not configured in the environment.');
    }
    const url = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=facebook&scope=email,public_profile`;
    res.redirect(url);
});

app.get('/api/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect(`${FRONTEND_URL}/?auth_error=Code%20not%20returned%20from%20Facebook`);
    }

    try {
        const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/auth/facebook/callback';
        const tokenRes = await fetch(`https://graph.facebook.com/v12.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`);
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
            throw new Error(tokenData.error?.message || 'Facebook token exchange failed');
        }

        const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`);
        const profile = await profileRes.json();
        if (!profileRes.ok) {
            throw new Error(profile.error?.message || 'Facebook profile fetch failed');
        }

        const email = profile.email || `${profile.id}@facebook.krishiv.co`;
        const name = profile.name;
        const avatar_url = profile.picture?.data?.url || '';
        const fb_id = profile.id;

        const user = await saveOrUpdateUser({
            email,
            name,
            avatar_url,
            provider: 'facebook',
            provider_id: fb_id
        });

        res.redirect(`${FRONTEND_URL}/?auth_success=true&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (err) {
        console.error('Facebook Callback Error:', err);
        res.redirect(`${FRONTEND_URL}/?auth_error=${encodeURIComponent(err.message)}`);
    }
});

// 4. Get Cart Items
app.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    if (supabase) {
        const { data, error } = await supabase
            .from('cart')
            .select('product_id, quantity')
            .eq('user_id', userId);
        if (!error) {
            return res.json(data.map(item => ({ productId: item.product_id, quantity: item.quantity })));
        }
    }
    return res.json(mockCart[userId] || []);
});

// 5. Update/Sync Cart
app.post('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    const { items } = req.body; // Array of { productId, quantity }

    if (supabase) {
        // Delete current cart for user
        await supabase.from('cart').delete().eq('user_id', userId);
        
        // Insert new cart items
        if (items && items.length > 0) {
            const rows = items.map(item => ({
                user_id: userId,
                product_id: item.productId,
                quantity: item.quantity
            }));
            const { error } = await supabase.from('cart').insert(rows);
            if (error) {
                return res.status(500).json({ error: error.message });
            }
        }
    } else {
        mockCart[userId] = items || [];
    }
    return res.json({ success: true, message: 'Cart synced successfully' });
});

// 6. Secure Order Placement (Server-Side Price Validation & Stock Protection)
app.post('/api/orders', async (req, res) => {
    const { userId, items, shipping, payment } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // 1. Server-Side Price Verification & Stock Validation
    let verifiedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
        const pId = Number(item.id || item.productId);
        const qty = Math.max(1, parseInt(item.quantity || 1, 10));
        
        const dbProduct = mockProducts.find(p => p.id === pId);
        if (!dbProduct) {
            return res.status(400).json({ error: `Product ID ${pId} not found.` });
        }

        const currentStock = dbProduct.stock !== undefined ? dbProduct.stock : (dbProduct.stock_qty || 0);
        if (currentStock < qty) {
            return res.status(400).json({ error: `Insufficient stock for ${dbProduct.name}. Only ${currentStock} remaining.` });
        }

        // Calculate authoritative item price from server
        const itemTotal = dbProduct.price * qty;
        verifiedSubtotal += itemTotal;

        // Decrement stock in server state
        if (dbProduct.stock !== undefined) dbProduct.stock -= qty;
        if (dbProduct.stock_qty !== undefined) dbProduct.stock_qty -= qty;

        verifiedItems.push({
            id: dbProduct.id,
            name: dbProduct.name,
            category: dbProduct.category,
            price: dbProduct.price,
            quantity: qty,
            total: itemTotal,
            image_url: dbProduct.image_url
        });
    }

    // 2. Authoritative Shipping & Tax Calculation
    const stateVal = shipping?.state || shipping?.shippingState || '';
    const payMethodVal = typeof payment === 'string' ? payment : (payment?.method || 'COD');
    const shippingCalc = calculateShippingAndTotal(verifiedSubtotal, stateVal, payMethodVal, mockStoreSettings, verifiedItems);

    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOrder = {
        id: orderId,
        user_id: userId || 'guest',
        total: shippingCalc.grandTotal,
        subtotal: shippingCalc.subtotal,
        shipping_fee: shippingCalc.shippingCharge,
        shippingCharge: shippingCalc.shippingCharge,
        shippingState: shippingCalc.shippingState,
        shippingRegion: shippingCalc.shippingRegion,
        codFee: shippingCalc.codFee,
        discount: shippingCalc.discount,
        tax: shippingCalc.tax,
        cgst: shippingCalc.cgst,
        sgst: shippingCalc.sgst,
        igst: shippingCalc.igst,
        paymentMethod: payMethodVal,
        items: {
            cartItems: verifiedItems,
            shipping: shipping || {},
            payment: payment || { method: payMethodVal }
        },
        status: 'placed',
        created_at: new Date().toISOString()
    };

    // 3. Persist Order to MongoDB if connected
    if (isMongoConnected) {
        try {
            await OrderModel.create({
                id: orderId,
                user_id: userId || 'guest',
                total: verifiedGrandTotal,
                items: newOrder.items,
                status: 'placed'
            });
        } catch (dbErr) {
            console.error('[MONGODB ORDER SAVE ERROR]', dbErr.message);
        }
    }

    // 4. Save Order to Memory & Clear Cart
    mockOrders.unshift(newOrder);
    if (userId) {
        mockCart[userId] = [];
    }

    // Log Activity
    mockLogs.unshift({
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: userId || 'Guest Customer',
        action: 'Order Placed',
        details: `Order #${orderId} placed for ₹${shippingCalc.grandTotal}`
    });

    console.log(`[ORDER SUCCESS] Placed order #${orderId} | Total: ₹${shippingCalc.grandTotal} | Items: ${verifiedItems.length}`);

    // Send Real-Time Email Notifications to Admin & Customer
    sendAdminOrderNotificationEmail(newOrder);
    sendCustomerOrderConfirmationEmail(newOrder);

    return res.json({
        success: true,
        message: 'Order placed successfully!',
        order: newOrder
    });
});

// Standard Razorpay Endpoints (POST /api/create-order & POST /api/verify-payment)
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        // Amount must be in paise, minimum 100 paise (₹1.00)
        let amountInPaise = parseInt(amount, 10);
        if (isNaN(amountInPaise) || amountInPaise < 100) {
            return res.status(400).json({ error: 'Minimum order amount is 100 paise (₹1.00).' });
        }

        const options = {
            amount: amountInPaise,
            currency: currency || 'INR',
            receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        };

        const razorpayOrder = await razorpay.orders.create(options);
        console.log(`[RAZORPAY SUCCESS] Order created: ${razorpayOrder.id} | Amount: ${amountInPaise} paise`);

        return res.json({
            success: true,
            order_id: razorpayOrder.id,
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TTFs5Y8XSXB91l'
        });
    } catch (err) {
        console.error('[RAZORPAY CREATE ORDER ERROR]', err.message);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: 'Failed to create Razorpay order', details: err.message });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature.' });
        }

        const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'jn5N1YSC2aEkM1rWKdbGTAMm').trim();
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const sigBuffer = Buffer.from(razorpay_signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            console.error(`[RAZORPAY VERIFICATION FAILED] Signature mismatch for Order ${razorpay_order_id}`);
            return res.status(400).json({ success: false, error: 'Invalid payment signature. Verification failed.' });
        }

        console.log(`[RAZORPAY VERIFICATION SUCCESS] Verified Order: ${razorpay_order_id} | Txn: ${razorpay_payment_id}`);
        return res.json({
            success: true,
            message: 'Payment verified successfully',
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id
        });
    } catch (err) {
        console.error('[RAZORPAY VERIFY ERROR]', err.message);
        return res.status(500).json({ error: 'Internal server error during verification', details: err.message });
    }
});

// 6.1 Create Razorpay Order (Server-Side Price Calculation & Token Signing)
app.post('/api/payment/create-razorpay-order', async (req, res) => {
    try {
        const { items, userId, shipping } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order items are required.' });
        }

        // Calculate verified total from server database
        let verifiedSubtotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const pId = Number(item.id || item.productId);
            const qty = Math.max(1, parseInt(item.quantity || 1, 10));
            const dbProduct = mockProducts.find(p => p.id === pId);
            if (!dbProduct) {
                return res.status(400).json({ error: `Product ID ${pId} not found.` });
            }

            const itemTotal = dbProduct.price * qty;
            verifiedSubtotal += itemTotal;
            verifiedItems.push({
                id: dbProduct.id,
                name: dbProduct.name,
                category: dbProduct.category,
                price: dbProduct.price,
                quantity: qty,
                total: itemTotal,
                image_url: dbProduct.image_url
            });
        }

        const stateVal = shipping?.state || shipping?.shippingState || '';
        const shippingCalc = calculateShippingAndTotal(verifiedSubtotal, stateVal, 'razorpay', mockStoreSettings, verifiedItems);
        const verifiedGrandTotal = shippingCalc.grandTotal;
        const amountInPaise = Math.round(verifiedGrandTotal * 100);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            notes: {
                userId: userId || 'guest',
                shippingName: shipping?.fullName || 'Valued Customer'
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        console.log(`[RAZORPAY SUCCESS] Order created: ${razorpayOrder.id} | Amount: ₹${verifiedGrandTotal} (${amountInPaise} paise)`);

        return res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TT54OF0mJvt1SP',
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            verifiedGrandTotal,
            verifiedSubtotal,
            shippingFee: shippingCalc.shippingCharge,
            shippingCalc,
            verifiedItems
        });
    } catch (err) {
        console.error('[RAZORPAY ORDER ERROR]', err.message);
        return res.status(500).json({ error: 'Failed to create Razorpay payment order.', details: err.message });
    }
});

// 6.2 Verify Razorpay Payment Signature & Complete Order
app.post('/api/payment/verify-razorpay', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            verifiedItems,
            shipping,
            paymentMethod
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing Razorpay payment verification parameters.' });
        }

        // Verify Cryptographic HMAC-SHA256 Signature
        const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'jn5N1YSC2aEkM1rWKdbGTAMm').trim();
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error(`[RAZORPAY VERIFICATION FAILED] Signature mismatch for Order ID ${razorpay_order_id}`);
            return res.status(400).json({ error: 'Payment signature verification failed. Transaction flagged.' });
        }

        // Stock decrement & order record creation
        const finalItems = verifiedItems || [];
        let verifiedSubtotal = 0;
        for (const item of finalItems) {
            const pId = Number(item.id);
            const dbProduct = mockProducts.find(p => p.id === pId);
            if (dbProduct) {
                verifiedSubtotal += (dbProduct.price * (item.quantity || 1));
                if (dbProduct.stock !== undefined) dbProduct.stock = Math.max(0, dbProduct.stock - item.quantity);
                if (dbProduct.stock_qty !== undefined) dbProduct.stock_qty = Math.max(0, dbProduct.stock_qty - item.quantity);
            } else {
                verifiedSubtotal += (item.price * (item.quantity || 1));
            }
        }

        const stateVal = shipping?.state || shipping?.shippingState || '';
        const shippingCalc = calculateShippingAndTotal(verifiedSubtotal, stateVal, 'razorpay', mockStoreSettings, finalItems);

        const orderId = `order-rzp-${Date.now()}`;
        const newOrder = {
            id: orderId,
            user_id: userId || 'guest',
            total: shippingCalc.grandTotal,
            subtotal: shippingCalc.subtotal,
            shipping_fee: shippingCalc.shippingCharge,
            shippingCharge: shippingCalc.shippingCharge,
            shippingState: shippingCalc.shippingState,
            shippingRegion: shippingCalc.shippingRegion,
            codFee: 0,
            discount: 0,
            tax: shippingCalc.tax,
            cgst: shippingCalc.cgst,
            sgst: shippingCalc.sgst,
            igst: shippingCalc.igst,
            paymentMethod: 'Razorpay Online',
            razorpay_order_id,
            razorpay_payment_id,
            items: {
                cartItems: finalItems,
                shipping: shipping || {},
                payment: { method: 'Razorpay Online (Test Mode)', paymentId: razorpay_payment_id }
            },
            status: 'placed',
            created_at: new Date().toISOString()
        };

        if (isMongoConnected) {
            try {
                await OrderModel.create({
                    id: orderId,
                    user_id: userId || 'guest',
                    total: verifiedGrandTotal || 0,
                    items: newOrder.items,
                    status: 'placed'
                });
            } catch (mErr) {
                console.error('[MONGODB RZP SAVE ERROR]', mErr.message);
            }
        }

        mockOrders.unshift(newOrder);
        if (userId) mockCart[userId] = [];

        mockLogs.unshift({
            id: `l-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: userId || 'Guest Customer',
            action: 'Razorpay Payment Completed',
            details: `Order #${orderId} paid via Razorpay (Txn: ${razorpay_payment_id})`
        });

        console.log(`[RAZORPAY PAYMENT VERIFIED] Order #${orderId} paid & saved! Txn ID: ${razorpay_payment_id}`);

        // Send Real-Time Email Notifications to Admin & Customer
        sendAdminOrderNotificationEmail(newOrder);
        sendCustomerOrderConfirmationEmail(newOrder);

        return res.json({
            success: true,
            message: 'Razorpay payment verified and order placed successfully!',
            order: newOrder
        });
    } catch (err) {
        console.error('[RAZORPAY VERIFY ERROR]', err.message);
        return res.status(500).json({ error: 'Razorpay payment verification failed.', details: err.message });
    }
});

// 6.5. Get User Orders
app.get('/api/orders/:userId', async (req, res) => {
    const { userId } = req.params;
    const { email, phone, name, requestingUserId } = req.query;

    if (requestingUserId && userId && userId !== 'guest' && String(requestingUserId) !== String(userId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view these orders.' });
    }

    let dbOrders = [];
    if (isMongoConnected) {
        try {
            const queryConditions = [];
            if (userId && userId !== 'guest' && userId !== 'undefined') {
                queryConditions.push({ user_id: userId });
            }
            if (email && email !== 'undefined' && email.trim() !== '') {
                queryConditions.push({ 'items.shipping.email': { $regex: new RegExp(email.trim(), 'i') } });
            }
            if (phone && phone !== 'undefined' && phone.trim() !== '') {
                queryConditions.push({ 'items.shipping.phone': phone.trim() });
            }
            if (name && name !== 'undefined' && name.trim() !== '') {
                queryConditions.push({ 'items.shipping.name': { $regex: new RegExp(name.trim(), 'i') } });
                queryConditions.push({ 'items.shipping.fullName': { $regex: new RegExp(name.trim(), 'i') } });
            }

            if (queryConditions.length === 0) {
                queryConditions.push({ user_id: userId });
            }

            dbOrders = await OrderModel.find({
                $or: queryConditions
            }).sort({ created_at: -1 }).lean();
        } catch (mErr) {
            console.error('[MONGODB GET USER ORDERS ERROR]', mErr.message);
        }
    }

    const mockUserOrders = mockOrders.filter(order => 
        (userId && order.user_id === userId) ||
        (email && order.items?.shipping?.email?.toLowerCase() === email.toLowerCase()) ||
        (phone && order.items?.shipping?.phone === phone) ||
        (name && (order.items?.shipping?.name || order.items?.shipping?.fullName)?.toLowerCase().includes(name.toLowerCase()))
    );

    const combinedMap = new Map();
    for (const o of [...(dbOrders || []), ...mockUserOrders]) {
        if (!combinedMap.has(o.id)) {
            combinedMap.set(o.id, o);
        }
    }

    const userOrders = Array.from(combinedMap.values());
    return res.json({ success: true, orders: userOrders });
});

// 6.6. Get Order by ID
app.get('/api/order/:orderId', async (req, res) => {
    const { orderId } = req.params;
    let foundOrder = null;

    if (isMongoConnected) {
        try {
            foundOrder = await OrderModel.findOne({ id: orderId }).lean();
        } catch (mErr) {
            console.error('[MONGODB GET ORDER BY ID ERROR]', mErr.message);
        }
    }

    if (!foundOrder) {
        foundOrder = mockOrders.find(order => order.id === orderId);
    }

    if (!foundOrder) {
        return res.status(404).json({ error: 'Order not found' });
    }
    return res.json({ success: true, order: foundOrder });
});

// 6.7. Cancel Order (Restock inventory + DB update + status notification)
app.put('/api/orders/:orderId/cancel', async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req.body || {};
    const cancelledAt = new Date().toISOString();

    const foundOrder = mockOrders.find(order => order.id === orderId);
    let targetOrder = foundOrder;

    if (!targetOrder && isMongoConnected) {
        try {
            targetOrder = await OrderModel.findOne({ id: orderId });
        } catch (err) {
            console.error('Mongo find order error:', err);
        }
    }

    if (!targetOrder) {
        return res.status(404).json({ error: 'Order not found' });
    }

    if (userId && targetOrder.user_id && targetOrder.user_id !== 'guest' && String(targetOrder.user_id) !== String(userId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to cancel this order.' });
    }

    if (targetOrder.status === 'cancelled') {
        return res.json({ success: true, message: 'Order is already cancelled.', order: targetOrder });
    }

    // 1. Restock item quantities back to inventory
    const cartItems = targetOrder.items?.cartItems || (Array.isArray(targetOrder.items) ? targetOrder.items : []);
    if (Array.isArray(cartItems)) {
        for (const item of cartItems) {
            const pId = Number(item.id || item.productId);
            const qty = Math.max(1, parseInt(item.quantity || 1, 10));
            const dbProduct = mockProducts.find(p => p.id === pId);
            if (dbProduct) {
                if (dbProduct.stock !== undefined) dbProduct.stock += qty;
                if (dbProduct.stock_qty !== undefined) dbProduct.stock_qty += qty;
            }
        }
    }

    // 2. Update status in memory
    targetOrder.status = 'cancelled';
    targetOrder.cancelled_at = cancelledAt;
    if (foundOrder) {
        foundOrder.status = 'cancelled';
        foundOrder.cancelled_at = cancelledAt;
    }

    // 3. Update status in MongoDB if connected
    if (isMongoConnected) {
        try {
            await OrderModel.updateOne({ id: orderId }, { $set: { status: 'cancelled', cancelled_at: cancelledAt } });
        } catch (dbErr) {
            console.error('[MONGODB CANCEL ERROR]', dbErr.message);
        }
    }

    // 4. Log Activity
    mockLogs.unshift({
        id: `l-${Date.now()}`,
        timestamp: cancelledAt,
        user: targetOrder.user_id || 'Customer',
        action: 'Order Cancelled',
        details: `Order #${orderId} cancelled by customer`
    });

    console.log(`[ORDER CANCELLED] Order #${orderId} marked cancelled and inventory restocked!`);

    return res.json({ success: true, message: 'Order cancelled successfully', order: targetOrder });
});

// 7. Customer Care Feedback Form
app.post('/api/feedback', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const feedback = { id: `feedback-${Date.now()}`, name, email, subject, message, date: new Date().toISOString() };
    mockFeedback.push(feedback);
    return res.json({ success: true, message: 'Feedback submitted successfully' });
});

// ====================================================
// ADMIN DASHBOARD BACKEND SERVICES & DATA
// ====================================================

let mockAdminUsers = [
    { id: 'admin-1', name: 'Krishiv Admin', email: 'krishivcorporation4513@gmail.com', password: process.env.SUPER_ADMIN_PASSWORD || 'admin123', role: 'Super Admin', avatar: '/images/admin_avatar.png' }
];

let mockCategories = [
    { id: 1, name: 'Skin Care', description: 'Organic ayurvedic face and skin treatments', image_url: '/images/orange_peel.png', banner_url: '/images/orange_peel.png', product_count: 5 },
    { id: 2, name: 'Body Care', description: 'Nourishing natural body powders and waxes', image_url: '/images/chocolate_wax_powder.png', banner_url: '/images/chocolate_wax_powder.png', product_count: 1 }
];

let mockCoupons = [];

let mockReviews = [];

let mockStoreSettings = {
    company_name: 'Krishiv Corporation',
    email: 'contact@krishiv.co',
    phone: '+91 98765 43210',
    address: 'Krishiv Hub, Science City Road, Surat, Gujarat, India',
    gst_number: '24APTPK3284N1Z6',
    currency: '₹',
    shipping_charge: 49,
    free_shipping_threshold: 499,
    gj_under299_rate: 49,
    gj_299_498_rate: 39,
    gj_499_plus_rate: 0,
    outside_under299_rate: 69,
    outside_299_498_rate: 59,
    outside_499_plus_rate: 0,
    cod_fee: 30,
    tax_percentage: 5,
    cosmetic_gst_rate: 18,
    herbal_gst_rate: 5,
    logo_url: '/images/logo.png',
    facebook_link: 'https://facebook.com',
    instagram_link: 'https://instagram.com'
};

// Auto-classify product GST slab based on name & category (only 18% or 5% allowed)
function classifyProductGst(product) {
    const searchStr = (String(product.name || '') + ' ' + String(product.category || '') + ' ' + String(product.tag || '') + ' ' + String(product.description || '') + ' ' + String(product.ingredients || '')).toLowerCase();
    const cosmeticKeywords = ['wax', 'cosmetic', 'cream', 'lotion', 'serum', 'chemical', 'hair removal', 'beauty', 'makeup', 'lipstick', 'foundation', 'mascara', 'concealer', 'toner', 'moisturizer', 'sunscreen', 'shampoo', 'conditioner', 'gel', 'soap', 'face wash', 'cleanser', 'scrub'];
    const isCosmeticProduct = cosmeticKeywords.some(kw => searchStr.includes(kw));
    return {
        gst_rate: isCosmeticProduct ? 18 : 5,
        gst_category: isCosmeticProduct ? 'Cosmetics & Waxes' : 'Ayurvedic & Herbal Powders',
        hsn_code: isCosmeticProduct ? '3304' : '3004'
    };
}

// Helper for state-based shipping rate calculation, statutory GST slabs & permanent order totals
function calculateShippingAndTotal(subtotal, state = '', paymentMethod = '', settings = mockStoreSettings, items = []) {
    const normState = String(state || '').trim().toLowerCase();
    const isGujarat = normState === 'gujarat' || normState === 'gj';
    
    let shippingCharge = 0;
    const freeThreshold = 499;
    
    const gjUnder299 = Number(settings.gj_under299_rate !== undefined ? settings.gj_under299_rate : 49);
    const gj299to498 = Number(settings.gj_299_498_rate !== undefined ? settings.gj_299_498_rate : 39);
    const gj499Plus = Number(settings.gj_499_plus_rate !== undefined ? settings.gj_499_plus_rate : 0);
    
    const outUnder299 = Number(settings.outside_under299_rate !== undefined ? settings.outside_under299_rate : 69);
    const out299to498 = Number(settings.outside_299_498_rate !== undefined ? settings.outside_299_498_rate : 59);
    const out499Plus = Number(settings.outside_499_plus_rate !== undefined ? settings.outside_499_plus_rate : 0);
    
    if (subtotal >= freeThreshold) {
        shippingCharge = isGujarat ? gj499Plus : out499Plus;
    } else if (isGujarat) {
        if (subtotal < 299) {
            shippingCharge = gjUnder299;
        } else {
            shippingCharge = gj299to498;
        }
    } else {
        if (subtotal < 299) {
            shippingCharge = outUnder299;
        } else {
            shippingCharge = out299to498;
        }
    }
    
    const normPayMethod = String(paymentMethod || '').toLowerCase();
    const isCod = normPayMethod === 'cod';
    const codFeeVal = isCod ? Number(settings.cod_fee !== undefined ? settings.cod_fee : 30) : 0;
    
    // Fixed GST Slabs: Cosmetics & Waxes = 18%, Ayurvedic & Herbal Powders = 5% (no other rates)
    const cosmeticGst = 18;
    const herbalGst = 5;
    
    let totalTax = 0;

    if (Array.isArray(items) && items.length > 0) {
        items.forEach(item => {
            const pId = Number(item.id || item.productId);
            const dbP = mockProducts.find(p => p.id === pId) || item;
            const qty = Math.max(1, parseInt(item.quantity || 1, 10));
            const itemTotal = (dbP.price || item.price || 0) * qty;

            const gstInfo = classifyProductGst(dbP);
            const rate = gstInfo.gst_rate;

            const itemTax = Math.round(itemTotal * (rate / 100));
            totalTax += itemTax;
        });
    } else {
        totalTax = Math.round(subtotal * (herbalGst / 100));
    }

    const cgstAmount = isGujarat ? Math.round(totalTax / 2) : 0;
    const sgstAmount = isGujarat ? (totalTax - cgstAmount) : 0;
    const igstAmount = isGujarat ? 0 : totalTax;

    const effectiveGstRate = subtotal > 0 ? Math.round((totalTax / subtotal) * 100) : 18;

    const discount = 0;
    const grandTotal = subtotal + shippingCharge + codFeeVal + totalTax - discount;
    
    return {
        subtotal,
        shippingCharge,
        shippingState: state || 'Outside Gujarat',
        shippingRegion: isGujarat ? 'Gujarat' : 'Outside Gujarat',
        codFee: codFeeVal,
        discount,
        tax: totalTax,
        effectiveGstRate,
        cgst: cgstAmount,
        sgst: sgstAmount,
        igst: igstAmount,
        grandTotal
    };
}

let mockLogs = [
    { id: 'l-1', timestamp: new Date().toISOString(), user: 'admin@krishiv.co', action: 'Production Environment Ready', details: 'Krishiv Corporation production database initialized' }
];

// ====================================================
// HARDENED ADMIN SECURITY ARCHITECTURE & AUTHENTICATION
// ====================================================

// Brute-Force Protection Rate Limiter (Max 5 attempts per 15 min per IP)
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Security Lockout: Too many failed admin login attempts from this IP. Locked for 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Cryptographically Secure Active Sessions Map (Token -> Session Metadata)
const activeAdminSessions = new Map();

// Cryptographically Secure Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token || typeof token !== 'string') {
        return res.status(401).json({ error: 'Unauthorized: Administrative authentication token required' });
    }

    const session = activeAdminSessions.get(token);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired administrative session token' });
    }

    // 12-Hour Session Expiration Check
    if (Date.now() > session.expiresAt) {
        activeAdminSessions.delete(token);
        return res.status(401).json({ error: 'Unauthorized: Admin session expired. Please log in again.' });
    }

    // Extend active session TTL on activity
    session.expiresAt = Date.now() + (12 * 60 * 60 * 1000);
    req.admin = session.admin;
    next();
}

// Super Admin Authorization Middleware (Strictly for Destructive & Broadcast Actions)
function requireSuperAdminAuth(req, res, next) {
    requireAdminAuth(req, res, () => {
        const isAdminSuper = req.admin?.role === 'Super Admin' || req.admin?.email === 'krishivcorporation4513@gmail.com' || req.admin?.email === 'admin@krishiv.co';
        if (!isAdminSuper) {
            return res.status(403).json({ error: 'Forbidden: Super Admin privileges required for this sensitive action.' });
        }
        next();
    });
}

// Admin Secure Login Endpoint
app.post('/api/admin/login', adminLoginLimiter, (req, res) => {
    const { email, password } = req.body || {};
    
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Bad Request: Valid administrative email and password required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = mockAdminUsers.find(a => a.email.toLowerCase() === cleanEmail);

    if (!admin) {
        return res.status(401).json({ error: 'Invalid administrative credentials.' });
    }

    // Constant-time password comparison to eliminate side-channel timing attacks
    const inputPassBuffer = Buffer.from(password);
    const expectedPassBuffer = Buffer.from(admin.password);
    
    const isPasswordValid = inputPassBuffer.length === expectedPassBuffer.length &&
        crypto.timingSafeEqual(inputPassBuffer, expectedPassBuffer);

    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid administrative credentials.' });
    }

    // Generate 256-bit cryptographically secure session token using crypto.randomBytes
    const token = `admin-sec-${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = Date.now() + (12 * 60 * 60 * 1000); // 12 Hours TTL

    const adminSessionData = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar
    };

    activeAdminSessions.set(token, {
        admin: adminSessionData,
        expiresAt: expiresAt
    });

    const log = {
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: admin.email,
        action: 'Admin Login',
        details: `Secure Admin Session Established (${admin.role})`
    };
    mockLogs.unshift(log);

    return res.json({
        success: true,
        token: token,
        admin: adminSessionData
    });
});

// Admin Logout (Invalidates cryptographically signed session token)
app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    if (token) {
        activeAdminSessions.delete(token);
    }
    
    return res.json({ success: true, message: 'Admin session terminated securely.' });
});

// Admin Stats (Protected with requireAdminAuth)
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
    const validOrders = mockOrders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = validOrders.filter(o => (o.date || o.created_at || '').startsWith(todayStr));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);

    const totalOrders = mockOrders.length;
    const pendingOrders = mockOrders.filter(o => o.status === 'pending' || o.status === 'placed' || o.status === 'processing').length;
    const cancelledOrders = mockOrders.filter(o => o.status === 'cancelled').length;
    const completedOrders = mockOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const totalCustomers = mockUsers.length;
    const totalProducts = mockProducts.length;
    const outOfStockProducts = mockProducts.filter(p => (p.stock !== undefined ? p.stock : (p.stock_qty || 0)) <= 0).length;
    const lowStockProducts = mockProducts.filter(p => {
        const qty = (p.stock !== undefined ? p.stock : (p.stock_qty || 0));
        return qty > 0 && qty <= 5;
    }).length;

    return res.json({
        success: true,
        stats: {
            totalRevenue,
            todayRevenue,
            totalOrders,
            pendingOrders,
            cancelledOrders,
            completedOrders,
            totalCustomers,
            totalProducts,
            outOfStockProducts,
            lowStockProducts
        }
    });
});

// Admin Product CRUD (Protected with requireAdminAuth & MongoDB Sync)
app.get('/api/admin/products', requireAdminAuth, async (req, res) => {
    let productsList = [...mockProducts];
    if (isMongoConnected) {
        try {
            const dbProducts = await ProductModel.find().lean();
            if (dbProducts && dbProducts.length > 0) {
                const map = new Map();
                for (const p of [...mockProducts, ...dbProducts]) {
                    const key = (p.id !== undefined && p.id !== null) ? String(p.id) : (p._id ? String(p._id) : String(p.name));
                    map.set(key, p);
                }
                productsList = Array.from(map.values());
            }
        } catch (mErr) {
            console.error('[MONGODB ADMIN GET PRODUCTS ERROR]', mErr.message);
        }
    }
    return res.json({ success: true, products: productsList });
});

app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
    const numId = req.body.id ? Number(req.body.id) : Date.now();
    const stockVal = req.body.stock !== undefined ? Number(req.body.stock) : 10;
    const newProduct = {
        id: numId,
        name: req.body.name || 'New Product',
        tag: req.body.tag || 'NATURAL',
        category: req.body.category || 'Skin Care',
        description: req.body.description || '',
        price: Number(req.body.price || 0),
        stock: stockVal,
        stock_qty: stockVal,
        stock_status: stockVal > 0 ? 'In Stock' : 'Out of Stock',
        ingredients: req.body.ingredients || '',
        usage: req.body.usage || '',
        image_url: req.body.image_url || '/images/orange_peel.png',
        status: req.body.status || 'Published'
    };

    // Auto-classify GST based on product name, category & description
    const gstInfo = classifyProductGst(newProduct);
    newProduct.gst_rate = gstInfo.gst_rate;
    newProduct.gst_category = gstInfo.gst_category;
    newProduct.hsn_code = gstInfo.hsn_code;

    mockProducts.push(newProduct);

    if (isMongoConnected) {
        try {
            await ProductModel.updateOne(
                { id: numId },
                { $set: newProduct },
                { upsert: true }
            );
            console.log(`[MONGODB] Product '${newProduct.name}' saved to Cloud Database.`);
        } catch (mErr) {
            console.error('[MONGODB CREATE PRODUCT ERROR]', mErr.message);
        }
    }

    mockLogs.unshift({ id: `l-${Date.now()}`, timestamp: new Date().toISOString(), user: 'admin@krishiv.co', action: 'Create Product', details: `Added ${newProduct.name}` });
    return res.json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    const rawId = req.params.id;
    const numId = Number(rawId);
    
    const index = mockProducts.findIndex(p => String(p.id) === String(rawId) || String(p._id) === String(rawId) || (!isNaN(numId) && Number(p.id) === numId));
    
    const updatePayload = { ...req.body };
    if (req.body.stock !== undefined) {
        updatePayload.stock = Number(req.body.stock);
        updatePayload.stock_qty = Number(req.body.stock);
        updatePayload.stock_status = Number(req.body.stock) > 0 ? 'In Stock' : 'Out of Stock';
    }

    // Re-classify GST if product name, category, or description changed
    if (req.body.name || req.body.category || req.body.description || req.body.tag || req.body.ingredients) {
        const existingProduct = index !== -1 ? mockProducts[index] : {};
        const merged = { ...existingProduct, ...updatePayload };
        const gstInfo = classifyProductGst(merged);
        updatePayload.gst_rate = gstInfo.gst_rate;
        updatePayload.gst_category = gstInfo.gst_category;
        updatePayload.hsn_code = gstInfo.hsn_code;
    }

    if (index !== -1) {
        mockProducts[index] = { ...mockProducts[index], ...updatePayload };
    }

    if (isMongoConnected) {
        try {
            await ProductModel.updateOne(
                { $or: [{ id: !isNaN(numId) ? numId : rawId }, { id: rawId }, { _id: rawId }] },
                { $set: updatePayload }
            );
            console.log(`[MONGODB UPDATE SUCCESS] Product '${updatePayload.name || rawId}' updated in Cloud Database.`);
        } catch (mErr) {
            console.error('[MONGODB UPDATE PRODUCT ERROR]', mErr.message);
        }
    }

    mockLogs.unshift({ id: `l-${Date.now()}`, timestamp: new Date().toISOString(), user: 'admin@krishiv.co', action: 'Update Product', details: `Updated product ${updatePayload.name || rawId}` });
    return res.json({ success: true, product: index !== -1 ? mockProducts[index] : updatePayload });
});

app.delete('/api/admin/products/:id', requireSuperAdminAuth, async (req, res) => {
    const id = Number(req.params.id);
    const index = mockProducts.findIndex(p => Number(p.id) === id);
    if (index !== -1) {
        mockProducts.splice(index, 1);
    }

    if (isMongoConnected) {
        try {
            await ProductModel.deleteOne({ id: id });
        } catch (mErr) {
            console.error('[MONGODB DELETE PRODUCT ERROR]', mErr.message);
        }
    }

    mockLogs.unshift({ id: `l-${Date.now()}`, timestamp: new Date().toISOString(), user: 'admin@krishiv.co', action: 'Delete Product', details: `Deleted product ID ${id}` });
    return res.json({ success: true });
});

// Admin Product Image File Upload (Base64 / Multipart)
app.post('/api/admin/upload', requireAdminAuth, (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'No image file data provided' });
    }

    try {
        const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        let ext = 'png';
        let buffer;

        if (matches && matches.length === 3) {
            ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(image, 'base64');
        }

        const safeFileName = `product_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        const filePath = path.join(uploadsDir, safeFileName);

        fs.writeFileSync(filePath, buffer);

        const publicUrl = `/uploads/${safeFileName}`;
        console.log(`[IMAGE UPLOAD] Product image saved: ${publicUrl}`);
        return res.json({ success: true, image_url: publicUrl });
    } catch (err) {
        console.error('[IMAGE UPLOAD ERROR]', err.message);
        return res.status(500).json({ error: 'Failed to save product image file' });
    }
});

// Admin Categories CRUD (Protected with requireAdminAuth)
app.get('/api/admin/categories', requireAdminAuth, (req, res) => {
    return res.json({ success: true, categories: mockCategories });
});

app.post('/api/admin/categories', requireAdminAuth, (req, res) => {
    const newCat = { id: Date.now(), product_count: 0, ...req.body };
    mockCategories.push(newCat);
    return res.json({ success: true, category: newCat });
});

app.put('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
    const id = Number(req.params.id);
    const index = mockCategories.findIndex(c => c.id === id);
    if (index !== -1) mockCategories[index] = { ...mockCategories[index], ...req.body };
    return res.json({ success: true, category: mockCategories[index] });
});

app.delete('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
    const id = Number(req.params.id);
    mockCategories = mockCategories.filter(c => c.id !== id);
    return res.json({ success: true });
});

// Admin Orders (Protected with requireAdminAuth)
app.get('/api/admin/orders', requireAdminAuth, async (req, res) => {
    let ordersList = [...mockOrders];
    if (isMongoConnected) {
        try {
            const dbOrders = await OrderModel.find().lean();
            if (dbOrders && dbOrders.length > 0) {
                const map = new Map();
                for (const o of [...mockOrders, ...dbOrders]) {
                    map.set(String(o.id), o);
                }
                ordersList = Array.from(map.values());
            }
        } catch (mErr) {
            console.error('[MONGODB ADMIN GET ORDERS ERROR]', mErr.message);
        }
    }
    return res.json({ success: true, orders: ordersList });
});

app.put('/api/admin/orders/:id/status', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const { status, trackingId, tracking_id, courier, trackingUrl } = req.body;
    const finalTrackingId = trackingId || tracking_id || '';
    const finalCourier = courier || 'India Post';
    const finalTrackingUrl = trackingUrl || 'https://www.indiapost.gov.in/';

    // If tracking ID is added, transition status to 'on_estimate'
    let newStatus = status;
    if (finalTrackingId && (!newStatus || newStatus === 'shipped' || newStatus === 'in_transit')) {
        newStatus = 'on_estimate';
    }

    const order = mockOrders.find(o => String(o.id) === String(id));
    if (order) {
        if (newStatus) order.status = newStatus;
        if (finalTrackingId) {
            order.trackingId = finalTrackingId;
            order.tracking_id = finalTrackingId;
            order.courier = finalCourier;
            order.trackingUrl = finalTrackingUrl;
            order.shipped_at = new Date().toISOString();
        }
    }

    if (isMongoConnected) {
        try {
            const updateDoc = {};
            if (newStatus) updateDoc.status = newStatus;
            if (finalTrackingId) {
                updateDoc.trackingId = finalTrackingId;
                updateDoc.tracking_id = finalTrackingId;
                updateDoc.courier = finalCourier;
                updateDoc.trackingUrl = finalTrackingUrl;
                updateDoc.shipped_at = new Date().toISOString();
            }
            await OrderModel.updateOne({ id: id }, { $set: updateDoc });
        } catch (mErr) {
            console.error('[MONGODB ADMIN UPDATE STATUS ERROR]', mErr.message);
        }
    }

    if (order && finalTrackingId && newStatus !== 'delivered') {
        sendShipmentTrackingEmail(order, finalTrackingId, finalCourier, finalTrackingUrl).catch(e => console.error(e));
    }
    if (order && newStatus === 'delivered') {
        sendOrderDeliveredEmail(order).catch(e => console.error(e));
    }

    mockLogs.unshift({ id: `l-${Date.now()}`, timestamp: new Date().toISOString(), user: 'admin@krishiv.co', action: 'Update Order Status & Tracking', details: `Order ${id} status set to ${newStatus || 'updated'}, Tracking: ${finalTrackingId || 'None'}` });
    return res.json({ success: true, order: order || { id, status: newStatus, trackingId: finalTrackingId } });
});

// Admin Customers (MongoDB Atlas + In-Memory Sync - Protected with requireAdminAuth)
app.get('/api/admin/customers', requireAdminAuth, async (req, res) => {
    let customersList = [...mockUsers];
    if (isMongoConnected) {
        try {
            const dbUsers = await UserModel.find().lean();
            if (dbUsers && dbUsers.length > 0) {
                const map = new Map();
                for (const u of [...mockUsers, ...dbUsers]) {
                    map.set(u.id || u.email, u);
                }
                customersList = Array.from(map.values());
            }
        } catch (mErr) {
            console.error('[MONGODB ADMIN GET CUSTOMERS ERROR]', mErr.message);
        }
    }
    const sanitizedCustomers = customersList.map(u => {
        const { password, passwordHash, salt, otpHash, __v, ...safeUser } = u;
        return safeUser;
    });
    return res.json({ success: true, customers: sanitizedCustomers });
});

app.put('/api/admin/customers/:id', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) mockUsers[index] = { ...mockUsers[index], ...req.body };

    if (isMongoConnected) {
        try {
            await UserModel.updateOne({ id: id }, { $set: req.body });
        } catch (mErr) {
            console.error('[MONGODB ADMIN UPDATE CUSTOMER ERROR]', mErr.message);
        }
    }

    return res.json({ success: true, customer: index !== -1 ? mockUsers[index] : req.body });
});

// Admin Delete Customer
app.delete('/api/admin/customers/:id', requireSuperAdminAuth, async (req, res) => {
    const id = req.params.id;
    mockUsers = mockUsers.filter(u => u.id !== id && u._id?.toString() !== id);

    if (isMongoConnected) {
        try {
            await UserModel.deleteOne({ _id: id });
            await UserModel.deleteOne({ id: id });
        } catch (mErr) {
            console.error('[MONGODB ADMIN DELETE CUSTOMER ERROR]', mErr.message);
        }
    }

    mockLogs.unshift({
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: req.admin?.email || 'admin@krishiv.co',
        action: 'Deleted Customer Record',
        details: `Customer ID ${id} removed`
    });

    return res.json({ success: true, message: 'Customer record deleted successfully' });
});

// Admin Purge All Customer Records
app.delete('/api/admin/customers', requireSuperAdminAuth, async (req, res) => {
    mockUsers = mockUsers.filter(u => u.role === 'admin' || u.email === 'krishivcorporation4513@gmail.com' || u.email === 'admin@krishiv.co');

    if (isMongoConnected) {
        try {
            await UserModel.deleteMany({ email: { $nin: ['krishivcorporation4513@gmail.com', 'admin@krishiv.co'] } });
            await OrderModel.deleteMany({});
        } catch (mErr) {
            console.error('[MONGODB ADMIN PURGE CUSTOMERS ERROR]', mErr.message);
        }
    }

    mockOrders = [];

    mockLogs.unshift({
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'admin@krishiv.co',
        action: 'Purged All Customer Records',
        details: 'All non-admin user accounts and customer details cleared'
    });

    return res.json({ success: true, message: 'All customer records and details successfully purged (Admin accounts preserved)' });
});

// Admin Coupons (Protected with requireAdminAuth)
app.get('/api/admin/coupons', requireAdminAuth, (req, res) => {
    return res.json({ success: true, coupons: mockCoupons });
});

app.post('/api/admin/coupons', requireAdminAuth, (req, res) => {
    const newCoupon = { id: `c-${Date.now()}`, current_uses: 0, active: true, ...req.body };
    mockCoupons.push(newCoupon);
    return res.json({ success: true, coupon: newCoupon });
});

app.delete('/api/admin/coupons/:id', requireAdminAuth, (req, res) => {
    mockCoupons = mockCoupons.filter(c => c.id !== req.params.id);
    return res.json({ success: true });
});

// Admin Reviews (Protected with requireAdminAuth)
app.get('/api/admin/reviews', requireAdminAuth, (req, res) => {
    return res.json({ success: true, reviews: mockReviews });
});

app.put('/api/admin/reviews/:id', requireAdminAuth, (req, res) => {
    const index = mockReviews.findIndex(r => r.id === req.params.id);
    if (index !== -1) mockReviews[index] = { ...mockReviews[index], ...req.body };
    return res.json({ success: true, review: mockReviews[index] });
});

// Admin Activity Audit Logs (Protected with requireAdminAuth)
app.get('/api/admin/logs', requireAdminAuth, (req, res) => {
    return res.json({ success: true, logs: mockLogs });
});

// Admin Settings (Protected with requireAdminAuth)
app.get('/api/admin/settings', requireAdminAuth, (req, res) => {
    return res.json({ success: true, settings: mockStoreSettings });
});

app.put('/api/admin/settings', requireAdminAuth, (req, res) => {
    mockStoreSettings = { ...mockStoreSettings, ...req.body };
    return res.json({ success: true, settings: mockStoreSettings });
});

// Helper for Generating Premium Ad Banner HTML Email
const generateBroadcastAdHtml = ({ title, message, discountCode, bannerType, ctaText, ctaLink }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f1ea; margin: 0; padding: 20px; color: #221d16; }
        .banner-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5dfd3; box-shadow: 0 12px 36px rgba(0,0,0,0.08); }
        .banner-header { background: linear-gradient(135deg, #1b261b 0%, #2a3a2a 50%, #3e503e 100%); padding: 36px 28px; text-align: center; color: #ffffff; position: relative; }
        .gold-badge { background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%); color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; display: inline-block; margin-bottom: 14px; box-shadow: 0 4px 12px rgba(212,175,55,0.3); }
        .banner-title { font-size: 26px; font-weight: 800; margin: 0 0 10px; line-height: 1.3; color: #ffffff; letter-spacing: -0.5px; }
        .banner-sub { font-size: 14px; opacity: 0.9; margin: 0; color: #e2e8f0; }
        .banner-body { padding: 32px 28px; text-align: center; }
        .message-text { font-size: 15px; line-height: 1.7; color: #4a453e; margin-bottom: 24px; }
        .coupon-box { background: #faf7f0; border: 2px dashed #aa820a; border-radius: 14px; padding: 18px; margin: 24px 0; text-align: center; }
        .coupon-label { font-size: 11px; font-weight: 700; color: #aa820a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .coupon-code { font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #1b261b; font-family: monospace; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #aa820a 0%, #8f8269 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 30px; letter-spacing: 0.5px; box-shadow: 0 6px 20px rgba(170,130,10,0.35); }
        .banner-footer { background: #f9f8f5; border-top: 1px solid #eee8dd; padding: 20px; text-align: center; font-size: 12px; color: #888075; }
      </style>
    </head>
    <body>
      <div class="banner-card">
        <div class="banner-header">
          <div class="gold-badge">✨ Special Announcement</div>
          <h1 class="banner-title">${title}</h1>
          <p class="banner-sub">Krishiv Corporation — Pure Organic Beauty & Wellness</p>
        </div>
        <div class="banner-body">
          <p class="message-text">${message}</p>
          ${discountCode ? `
            <div class="coupon-box">
              <div class="coupon-label">Use Coupon Code At Checkout</div>
              <div class="coupon-code">${discountCode}</div>
            </div>
          ` : ''}
          <div style="margin-top: 28px;">
            <a href="${ctaLink || 'http://localhost:5173'}" class="cta-btn">${ctaText || 'Shop Collection Now'} →</a>
          </div>
        </div>
        <div class="banner-footer">
          <strong>KRISHIV CORPORATION</strong><br>
          GSTIN: 24APTPK3284N1Z6 | Surat, Gujarat, India<br>
          You are receiving this email because you registered on krishiv.co.
        </div>
      </div>
    </body>
    </html>
    `;
};

// Admin Broadcast Campaign API (Dispatches Ad Banner Email to ALL Customers - Super Admin Only)
app.post('/api/admin/broadcast', requireSuperAdminAuth, async (req, res) => {
    const { subject, title, message, discountCode, ctaText, ctaLink, bannerType } = req.body;

    if (!title || !message) {
        return res.status(400).json({ error: 'Announcement Title and Message are required for broadcast' });
    }

    let recipientSet = new Set(['patelvraj1922@gmail.com', 'krishivcorporation4513@gmail.com']);
    
    for (const u of mockUsers) {
        if (u.email && u.email.includes('@')) recipientSet.add(u.email.toLowerCase().trim());
    }

    if (isMongoConnected) {
        try {
            const dbUsers = await UserModel.find({}, 'email').lean();
            if (dbUsers) {
                for (const u of dbUsers) {
                    if (u.email && u.email.includes('@')) recipientSet.add(u.email.toLowerCase().trim());
                }
            }
        } catch (mErr) {
            console.error('[MONGODB BROADCAST FETCH USERS ERROR]', mErr.message);
        }
    }

    const recipientsList = Array.from(recipientSet);
    console.log(`[BROADCAST DISPATCH] Sending ad banner campaign to ${recipientsList.length} customers:`, recipientsList);

    const htmlContent = generateBroadcastAdHtml({
        title,
        message,
        discountCode,
        bannerType,
        ctaText,
        ctaLink
    });

    const emailSubject = subject || `✨ ${title} | Krishiv Corporation`;

    const { transporter } = await getEmailTransporter();
    let sentCount = 0;
    for (const email of recipientsList) {
        try {
            await transporter.sendMail({
                from: '"KRISHIV CORPORATION" <krishivcorporation4513@gmail.com>',
                to: email,
                subject: emailSubject,
                html: htmlContent,
                headers: {
                    'X-Auto-Response-Suppress': 'All',
                    'X-Mailer': 'Krishiv Marketing Broadcast Engine'
                }
            });
            sentCount++;
        } catch (mErr) {
            console.error(`[BROADCAST EMAIL FAILED for ${email}]:`, mErr.message);
        }
    }

    const newBroadcast = {
        id: `bcast-${Date.now()}`,
        timestamp: new Date().toISOString(),
        subject: emailSubject,
        title,
        message,
        discountCode: discountCode || '',
        recipientsCount: recipientsList.length,
        sentCount
    };

    mockLogs.unshift({
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'admin@krishiv.co',
        action: 'Broadcast Campaign Dispatched',
        details: `Sent '${title}' to ${sentCount}/${recipientsList.length} customers`
    });

    return res.json({
        success: true,
        message: `Broadcast marketing campaign sent successfully to ${sentCount} customers!`,
        broadcast: newBroadcast,
        recipientsCount: recipientsList.length,
        sentCount
    });
});

// Health Check Endpoint for Load Balancers & Monitoring
app.get('/api/health', (req, res) => {
    return res.json({
        status: 'ok',
        service: 'Krishiv Corporation E-commerce API',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Production Static File Serving (Single-Port Full-Stack Deployment)
const distPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(distPath)) {
    console.log('[PRODUCTION DEPLOYMENT] Serving frontend production build from:', distPath);
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Start Server (Standalone Node.js or Vercel Serverless)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
