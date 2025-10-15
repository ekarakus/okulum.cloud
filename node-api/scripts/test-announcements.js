const http = require('http');

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
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

function getAnnouncements() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/announcements', res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch (e) { resolve({ status: res.statusCode, body }); }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Posting test announcement...');
    const payload = { title: 'Test HTML Duyuru', content: '<p><strong>Merhaba</strong> bu bir <em>test</em> duyurudur.</p>', is_active: true };
    const postRes = await postAnnouncement(payload);
    console.log('POST result:', postRes.status, postRes.body && postRes.body.id ? 'created id=' + postRes.body.id : postRes.body);

    console.log('Fetching list...');
    const list = await getAnnouncements();
    console.log('LIST status', list.status);
    console.log('First 5 entries:', Array.isArray(list.body) ? list.body.slice(0,5).map(x=>({id:x.id,title:x.title})) : list.body);
  } catch (err) {
    console.error('Test failed', err);
    process.exit(2);
  }
}

run();
