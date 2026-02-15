// utils.js
export function escapeHtml(t){if(!t)return'';return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export function escapeJs(t){if(!t)return'';var s=String(t);s=s.split(String.fromCharCode(92)).join(String.fromCharCode(92,92));s=s.split(String.fromCharCode(39)).join(String.fromCharCode(92,39));s=s.replace(/"/g,'&quot;');return s;}
export function generateId(){return Date.now()*1000+Math.floor(Math.random()*1000);}
export function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.error("Save error", e); }
}