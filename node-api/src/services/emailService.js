const nodemailer = require('nodemailer');
const GlobalSetting = require('../models/globalSetting');

let cachedTransport = null;
let cachedConfigHash = null;

function buildHash(cfg){
  return [cfg.provider,cfg.smtp_host,cfg.smtp_port,cfg.smtp_secure,cfg.smtp_user,cfg.from_email].join('|');
}

function normalizeCustomOptions(cfg){
  let port = parseInt(cfg.smtp_port,10);
  if (!port) port = 587; // default STARTTLS
  let secure = !!cfg.smtp_secure; // user selection
  // Otomatik düzeltmeler: 465 -> secure true, 587 -> secure false
  if (port === 465 && !secure) secure = true;
  if (port === 587 && secure) secure = false; // çoğu sağlayıcı 587'de STARTTLS bekler
  return {
    host: cfg.smtp_host,
    port,
    secure,
    auth: cfg.smtp_user ? { user: cfg.smtp_user, pass: cfg.smtp_password } : undefined,
    tls: { minVersion: 'TLSv1.2' },
    debug: !!process.env.SMTP_DEBUG,
    logger: !!process.env.SMTP_DEBUG
  };
}

async function getTransport(forceRefresh = false) {
  const settings = await GlobalSetting.findOne();
  if (!settings) throw new Error('SMTP ayarları tanımlı değil');
  const cfg = settings.toJSON();
  const hash = buildHash(cfg);
  if (!forceRefresh && cachedTransport && cachedConfigHash === hash) return { transport: cachedTransport, cfg };

  let transportOptions;
  if (cfg.provider === 'gmail') {
    // Gmail otomatik servis ayarı (nodemailer servis preset)
    transportOptions = {
      service: 'gmail',
      auth: { user: cfg.smtp_user, pass: cfg.smtp_password }
    };
  } else {
    transportOptions = normalizeCustomOptions(cfg);
  }

  const transporter = nodemailer.createTransport(transportOptions);
  // verify ile erken bağlantı testi (sessiz hata için try/catch)
  try { await transporter.verify(); } catch (e) { /* verify başarısız olabilir, sendMail denemesi fallback yapacak */ }

  cachedTransport = transporter;
  cachedConfigHash = hash;
  return { transport: transporter, cfg };
}

async function attemptSend(transport, mailOptions){
  return transport.sendMail(mailOptions);
}

async function sendMail({ to, subject, html, text }) {
  const { transport, cfg } = await getTransport();
  const fromName = cfg.from_name || 'Sistem';
  const fromEmail = cfg.from_email || cfg.smtp_user;
  if (!fromEmail) throw new Error('Gönderen email tanımlı değil');
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text: text || undefined,
    html: html || undefined
  };
  try {
    return await attemptSend(transport, mailOptions);
  } catch (err) {
    // TLS / version mismatch fallback
    if (err && err.code === 'ESOCKET' && /wrong version number/i.test(err.message || '')) {
      const settings = await GlobalSetting.findOne();
      const cfg2 = settings.toJSON();
      if (cfg2.provider !== 'gmail') {
        const base = normalizeCustomOptions(cfg2);
        // flip secure & adjust port if typical mismatch
        if (base.port === 587) {
          base.secure = true; base.port = 465; // dene
        } else if (base.port === 465) {
          base.secure = false; base.port = 587; // dene
        } else {
          base.secure = !base.secure; // başka port ise sadece toggle dene
        }
        try {
          const altTransport = nodemailer.createTransport(base);
          await altTransport.verify().catch(()=>{});
          const result = await attemptSend(altTransport, mailOptions);
          // fallback başarılıysa cache güncelle
            cachedTransport = altTransport;
          cachedConfigHash = buildHash(cfg2) + ':fallback';
          return result;
        } catch (e2) {
          throw new Error('TLS/Port uyumsuzluğu ve otomatik düzeltme başarısız: ' + e2.message);
        }
      }
    }
    // Diğer hatalar / ya da fallback başarısız
    let extra = '';
    if (err.command === 'CONN') extra = ' (Bağlantı kurulamadı. Port & güvenli (secure) seçimini kontrol edin.)';
    throw new Error(err.message + extra);
  }
}

async function sendTestEmail(target) {
  return sendMail({
    to: target,
    subject: 'Test Email',
    text: 'Bu bir test e-postasıdır.',
    html: '<p>Bu bir <strong>test</strong> e-postasıdır.</p>'
  });
}

module.exports = { sendMail, sendTestEmail };
