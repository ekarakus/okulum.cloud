const http = require('http');
const fs = require('fs');
const path = require('path');

function postAnnouncement(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const opts = {
      hostname: 'localhost', port: 3000, path: '/api/announcements', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { resolve({ status: res.statusCode, body: JSON.parse(body) }); });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

function uploadAttachment(id, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '--------------------------' + Date.now().toString(16);
    const opts = { hostname: 'localhost', port: 3000, path: `/api/announcements/${id}/attachments`, method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary } };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch (e) { resolve({ status: res.statusCode, body }); } });
    });
    req.on('error', reject);
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    req.write(`--${boundary}\r\n`);
    req.write(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
    req.write(`Content-Type: application/octet-stream\r\n\r\n`);
    req.write(fileContent);
    req.write(`\r\n--${boundary}--\r\n`);
    req.end();
  });
}

async function run() {
  try {
    console.log('Posting announcement...');
    const a = await postAnnouncement({ title: 'Upload Test', content: '<p>file test</p>' });
    console.log('Created id', a.body.id);
    const tmp = path.join(__dirname, 'tmp_upload.txt');
    fs.writeFileSync(tmp, 'Hello attachment');
    const up = await uploadAttachment(a.body.id, tmp);
    console.log('Upload result', up);
  } catch (e) { console.error(e); process.exit(2); }
}

run();
