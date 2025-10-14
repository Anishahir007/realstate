import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 600); // 10 minutes default
const DEFAULT_SMS_COUNTRY_CODE = process.env.DEFAULT_SMS_COUNTRY_CODE || '+91';
const OTP_CODE_LENGTH = 6;

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }
  try {
    const sidMasked = `${String(accountSid).slice(0, 4)}...${String(accountSid).slice(-4)}`;
    console.log('[OTP] Using Twilio account', sidMasked);
  } catch (_) {}
  return twilio(accountSid, authToken);
}

function normalizePhone(raw) {
  if (typeof raw !== 'string') return raw;
  const t = raw.trim().replace(/\s+/g, '');
  if (t.startsWith('+')) return t; // already E.164
  if (/^91\d{10}$/.test(t)) return `+${t}`; // missing plus
  if (/^0?\d{10}$/.test(t)) {
    const local = t.replace(/^0/, '');
    return `${DEFAULT_SMS_COUNTRY_CODE}${local}`;
  }
  return t;
}

function generateOtpCode() {
  let code = '';
  for (let i = 0; i < OTP_CODE_LENGTH; i += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  if (/^0+$/.test(code)) return '123456'; // avoid all zeros
  return code;
}

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS otp_requests (
    id CHAR(36) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    meta JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY ix_otp_requests_phone (phone),
    KEY ix_otp_requests_exp (expires_at)
  )`);
}

async function storeOtp({ id, phone, purpose, codeHash, metaJson, ttlSeconds }) {
  await ensureTable();
  const expiresSeconds = Number(ttlSeconds || OTP_TTL_SECONDS);
  await pool.query(
    `INSERT INTO otp_requests (id, phone, purpose, code_hash, meta, expires_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
    [id, phone, purpose, codeHash, metaJson, expiresSeconds]
  );
}

export async function sendSignupOtp({ phone, purpose, meta, smsBody }) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) throw new Error('Phone is required for OTP');
  if (!purpose) throw new Error('Purpose is required for OTP');

  const id = uuidv4();
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const metaJson = JSON.stringify(meta || {});

  await storeOtp({ id, phone: normalizedPhone, purpose, codeHash, metaJson, ttlSeconds: OTP_TTL_SECONDS });

  const client = getTwilioClient();
  const body = smsBody || `Your verification code is ${code}. It expires in ${Math.round(OTP_TTL_SECONDS / 60)} minutes.`;

  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || undefined;
  const from = process.env.TWILIO_FROM || process.env.TWILIO_PHONE_NUMBER || undefined;
  const messageParams = { to: normalizedPhone, body };
  if (messagingServiceSid) messageParams.messagingServiceSid = messagingServiceSid;
  else if (from) messageParams.from = from;
  else throw new Error('Either TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM must be configured');

  try {
    console.log('[OTP] Sending SMS', { to: normalizedPhone, via: messagingServiceSid ? 'messagingServiceSid' : 'fromNumber' });
    const resp = await client.messages.create(messageParams);
    console.log('[OTP] Twilio response status:', resp?.status, 'sid:', resp?.sid);
  } catch (err) {
    // If sending fails (e.g., Twilio trial to unverified number), delete the OTP record
    try { await pool.query('DELETE FROM otp_requests WHERE id = ? LIMIT 1', [id]); } catch (_) { /* ignore */ }
    console.error('[OTP] Failed to send SMS:', err?.message || err);
    throw err;
  }

  return { otpId: id };
}

export async function verifySignupOtp({ otpId, code, expectedPurpose }) {
  if (!otpId || !code) return { ok: false, reason: 'missing' };
  const [rows] = await pool.query(
    'SELECT id, phone, purpose, code_hash, meta, expires_at, verified_at FROM otp_requests WHERE id = ? LIMIT 1',
    [otpId]
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: 'not_found' };
  if (expectedPurpose && row.purpose !== expectedPurpose) return { ok: false, reason: 'purpose_mismatch' };
  if (row.verified_at) return { ok: false, reason: 'already_used' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };
  const match = await bcrypt.compare(String(code), row.code_hash);
  if (!match) return { ok: false, reason: 'invalid_code' };

  await pool.query('UPDATE otp_requests SET verified_at = NOW() WHERE id = ?', [otpId]);
  let meta = {};
  try { meta = row.meta ? JSON.parse(row.meta) : {}; } catch (_) { meta = {}; }
  console.log('[OTP] Verification passed for', { otpId });
  return { ok: true, phone: row.phone, purpose: row.purpose, meta };
}

export async function consumeOtp(otpId) {
  if (!otpId) return;
  try {
    await pool.query('DELETE FROM otp_requests WHERE id = ? LIMIT 1', [otpId]);
  } catch (_) { /* ignore */ }
}


