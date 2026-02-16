// utils.js - Fonctions utilitaires
// © 2025 Quentin THOMAS

function escapeHtml(t){
  if(!t)return'';
  return String(t)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function escapeJs(t){
  if(!t)return'';
  var s=String(t);
  s=s.split(String.fromCharCode(92)).join(String.fromCharCode(92,92));
  s=s.split(String.fromCharCode(39)).join(String.fromCharCode(92,39));
  s=s.replace(/"/g,'&quot;');
  return s;
}

function generateId(){
  return Date.now()*1000+Math.floor(Math.random()*1000);
}

function saveData(key, data) {
  try { 
    localStorage.setItem(key, JSON.stringify(data)); 
  } catch(e) { 
    console.error("Save error", e); 
  }
}

function lightenColor(col, amt) {
  var usePound = false;
  if (col[0] == "#") {
    col = col.slice(1);
    usePound = true;
  }
  var num = parseInt(col, 16);
  var r = (num >> 16) + amt * 255;
  if (r > 255) r = 255;
  else if  (r < 0) r = 0;
  var b = ((num >> 8) & 0x00FF) + amt * 255;
  if (b > 255) b = 255;
  else if  (b < 0) b = 0;
  var g = (num & 0x0000FF) + amt * 255;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (usePound?"#":"") + ((r << 16) | (b << 8) | g).toString(16).padStart(6, '0');
}

console.log('✓ Utils chargé');
