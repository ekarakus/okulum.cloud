const GlobalSetting = require('../models/globalSetting');
const { sendTestEmail } = require('../services/emailService');

async function getSettings(req, res) {
  try {
    const row = await GlobalSetting.findOne();
    return res.json(row || {});
  } catch (e) {
    console.error('Error fetching global settings', e);
    res.status(500).json({ error: 'Global ayarlar alınamadı' });
  }
}

async function upsertSettings(req, res) {
  try {
    const data = req.body || {};
    let row = await GlobalSetting.findOne();
    if (!row) {
      row = await GlobalSetting.create(data);
    } else {
      await row.update(data);
    }
    res.json(row);
  } catch (e) {
    console.error('Error saving global settings', e);
    res.status(500).json({ error: 'Global ayarlar kaydedilemedi' });
  }
}

module.exports = { getSettings, upsertSettings };
async function testEmail(req,res){
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Test için hedef email gerekli' });
    await sendTestEmail(to);
    res.json({ success: true });
  } catch(e){
    console.error('Test email error', e);
    res.status(500).json({ error: e.message });
  }
}

module.exports.testEmail = testEmail;
