#!/usr/bin/env node
const http = require('http');
const https = require('https');
const url = require('url');

function fetchJson(u){
  return new Promise((resolve,reject)=>{
    const p = url.parse(u);
    const lib = p.protocol === 'https:' ? https : http;
    const opts = { hostname: p.hostname, port: p.port, path: p.path, method: 'GET' };
    const req = lib.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', ()=>{
        try{ const j = JSON.parse(data); resolve(j); }catch(e){ reject(new Error('Invalid JSON response')) }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function parseTimeToDate(t, base){
  if (!t) return null;
  // accept HH:MM or HH:MM:SS
  const m = String(t).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const hh = parseInt(m[1],10);
  const mm = parseInt(m[2],10);
  const ss = m[3] ? parseInt(m[3],10) : 0;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, ss);
}

function formatTime(d){
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function findActivePeriod(lessons, now){
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // filter by day_of_week if present
  const jsDay = now.getDay(); // 0=Sun
  const turkishDay = jsDay === 0 ? 7 : jsDay; // API uses 1..7
  const mapped = [];
  for (const l of lessons){
    try{
      // If entry has day_of_week and doesn't match, skip
      if (typeof l.day_of_week !== 'undefined' && l.day_of_week !== null){
        if (Number(l.day_of_week) !== turkishDay) continue;
      }
      let start = null, end = null;
      if (l.start_time) start = parseTimeToDate(l.start_time, today);
      if (l.end_time) end = parseTimeToDate(l.end_time, today);
      if (!end && l.duration_minutes && start) end = new Date(start.getTime() + Number(l.duration_minutes)*60000);
      // legacy time field
      if (!start && !end && l.time){
        const parts = String(l.time).split('-').map(s=>s.trim());
        if (parts.length>=2){
          start = parseTimeToDate(parts[0], today);
          end = parseTimeToDate(parts[1], today);
        }
      }
      if (!start || !end) continue;
      mapped.push({ orig: l, start, end });
    }catch(e){ continue; }
  }
  // find active (now between start and end inclusive)
  const active = mapped.find(p => now >= p.start && now <= p.end);
  if (active) return { match: active, type: 'active' };
  // otherwise find next start >= now, sorted
  const upcoming = mapped.filter(p => p.start > now).sort((a,b)=>a.start - b.start);
  if (upcoming.length>0) return { match: upcoming[0], type: 'upcoming' };
  return { match: null, type: 'none' };
}

async function main(){
  // simple arg parsing (no external deps): --sim "ISO" --school 1 or positional: sim school
  const raw = process.argv.slice(2);
  let sim = null; let school = 1;
  for (let i=0;i<raw.length;i++){
    const a = raw[i];
    if (a === '--sim' || a === '-s') { sim = raw[i+1]; i++; }
    else if (a === '--school') { school = raw[i+1]; i++; }
    else if (!sim) { sim = a; }
    else if (!school) { school = a; }
  }
  if (!sim){
    console.error('Usage: node check-period.js --sim "2025-10-24T10:19:00" [--school 1]');
    process.exit(1);
  }
  const now = new Date(sim);
  if (isNaN(now.getTime())){ console.error('Invalid sim time:', sim); process.exit(1); }
  const apiBase = process.env.API_BASE || 'http://127.0.0.1:3000/api';
  const urlFetch = `${apiBase}/school-time-table?school_id=${encodeURIComponent(school)}`;
  console.log(`Fetching schedule from ${urlFetch} ...`);
  try{
    const res = await fetchJson(urlFetch);
    // schedule may be object with lessons array or array directly
    let lessons = [];
    if (Array.isArray(res)) lessons = res;
    else if (res && Array.isArray(res.lessons)) lessons = res.lessons;
    else if (res && Array.isArray(res.entries)) lessons = res.entries;
    else if (res && Array.isArray(res.data)) lessons = res.data;
    else {
      console.error('Unknown schedule structure. Response keys:', Object.keys(res||{}));
      process.exit(1);
    }
    console.log(`Loaded ${lessons.length} lessons/rows`);
    const out = findActivePeriod(lessons, now);
    if (out.type === 'active'){
      const p = out.match;
      console.log('Status: IN A PERIOD (active)');
      console.log('Period data:', JSON.stringify(p.orig, null, 2));
      console.log('Start:', p.start.toISOString(), 'End:', p.end.toISOString());
      console.log('Title/period_name:', p.orig.period_name || p.orig.title || '(no title)');
      console.log('TimeRange:', formatTime(p.start), '-', formatTime(p.end));
    } else if (out.type === 'upcoming'){
      const p = out.match;
      console.log('Status: NO current period, upcoming next at', p.start.toISOString());
      console.log('Next period data:', JSON.stringify(p.orig, null, 2));
      console.log('Title/period_name:', p.orig.period_name || p.orig.title || '(no title)');
      console.log('TimeRange:', formatTime(p.start), '-', formatTime(p.end));
    } else {
      console.log('No period data matched for today.');
    }
  }catch(e){
    console.error('Failed to fetch or parse schedule:', e.message || e);
    process.exit(2);
  }
}

main();
