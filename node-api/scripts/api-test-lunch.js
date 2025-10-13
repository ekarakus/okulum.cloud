const BASE = 'http://localhost:3000/api';

async function post(path, body) {
  const res = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function put(path, body) {
  const res = await fetch(BASE + path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function get(path) {
  const res = await fetch(BASE + path);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function del(path) {
  const res = await fetch(BASE + path, { method: 'DELETE' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function run() {
  try {
    console.log('Testing invalid lunch_start_time');
    const payloadInvalid = {
      name: 'API Test School 1',
      code: 'APIT1',
      province_id: 34,
      district_id: 1,
      school_type: 'ilk_okul',
      is_double_shift: true,
      start_time: '08:00',
      lunch_start_time: '25:99'
    };
    try {
      await post('/schools', payloadInvalid);
      console.error('ERROR: invalid payload was accepted');
    } catch (err) {
      console.log('Invalid payload rejected as expected:', err.data || err);
    }

    console.log('Testing valid lunch_start_time creation');
    const payloadValid = { ...payloadInvalid, code: 'APIT2', lunch_start_time: '12:15' };
    const resp = await post('/schools', payloadValid);
    console.log('Created school:', resp.id || resp);

    const id = resp.id;
    console.log('Testing update: switching to single shift (should null lunch)');
    await put(`/schools/${id}`, { is_double_shift: false });
    const updated = await get(`/schools/${id}`);
    console.log('After update:', { lunch_start_time: updated.lunch_start_time, is_double_shift: updated.is_double_shift });

    // Cleanup
    await del(`/schools/${id}`);
    console.log('Cleanup done');
  } catch (err) {
    console.error('Test failed:', err.data || err);
  }
}

run();
