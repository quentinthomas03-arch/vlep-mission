// timers.js - Timers CT et dictÃ©e vocale
// Ãƒâ€šÂ© 2025 Quentin THOMAS
// ChronomÃƒÆ’Ã‚Â¨tres CT 15min, dictÃ©e vocale amÃ©liorÃ©e

// ===================================================
// DICTÃƒÆ’Ã¢â‚¬Â°E VOCALE - Version amÃ©liorÃ©e
// Corrections : bug de duplication, affichage live,
// auto-relance, commandes ponctuation
// ===================================================

var activeDictation = null;

// Remplacement des commandes vocales par de la ponctuation
var PONCTUATION_COMMANDS = [
  { pattern: /\bpoint virgule\b/gi,    replacement: '; ' },
  { pattern: /\bpoint d.interrogation\b/gi, replacement: '? ' },
  { pattern: /\bpoint d.exclamation\b/gi,   replacement: '! ' },
  { pattern: /\bnouvelle ligne\b/gi,   replacement: '\n' },
  { pattern: /\bretour.{0,5}ligne\b/gi,replacement: '\n' },
  { pattern: /\btiret\b/gi,            replacement: '- ' },
  { pattern: /\bvirgule\b/gi,          replacement: ', ' },
  { pattern: /\bdeuxpoints\b/gi,       replacement: ': ' },
  { pattern: /\bdeux points\b/gi,      replacement: ': ' },
  { pattern: /\bpoint\b/gi,            replacement: '. ' },
  { pattern: /\bouvrir parenthÃƒÆ’Ã‚Â¨se\b/gi,replacement: '(' },
  { pattern: /\bfermer parenthÃƒÆ’Ã‚Â¨se\b/gi,replacement: ')' },
];

function applyPonctuationCommands(text) {
  PONCTUATION_COMMANDS.forEach(function(cmd) {
    text = text.replace(cmd.pattern, cmd.replacement);
  });
  // Nettoyer les espaces multiples sauf les sauts de ligne
  text = text.replace(/ {2,}/g, ' ');
  return text;
}

// Afficher le panel de dictÃ©e flottant
function showDictationPanel(prelId, subIdx) {
  var existing = document.getElementById('dictation-panel');
  if (existing) existing.remove();

  var panel = document.createElement('div');
  panel.id = 'dictation-panel';
  panel.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0',
    'background:#1e293b', 'color:white', 'padding:16px',
    'z-index:9999', 'border-radius:16px 16px 0 0',
    'box-shadow:0 -4px 24px rgba(0,0,0,0.4)',
    'min-height:140px', 'display:flex', 'flex-direction:column', 'gap:10px'
  ].join(';');

  panel.innerHTML = [
    '<div style="display:flex;align-items:center;gap:10px;">',
      '<div id="dictation-dot" style="width:14px;height:14px;border-radius:50%;background:#ef4444;animation:dictPulse 1s infinite;flex-shrink:0;"></div>',
      '<span style="font-weight:700;font-size:14px;">DictÃ©e en cours...</span>',
      '<button onclick="stopDictation();" style="margin-left:auto;background:#ef4444;color:white;border:none;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;">⏹ Stop</button>',
    '</div>',
    '<div id="dictation-interim" style="',
      'background:#0f172a;border-radius:8px;padding:10px 12px;',
      'font-size:14px;min-height:50px;line-height:1.5;',
      'color:#94a3b8;font-style:italic;',
      'white-space:pre-wrap;word-break:break-word;',
    '">',
      '<span style="color:#475569;">En attente de voix...</span>',
    '</div>',
    '<div style="font-size:11px;color:#64748b;text-align:center;">',
      'Dites : "virgule" "point" "nouvelle ligne" "tiret"',
    '</div>',
  ].join('');

  document.body.appendChild(panel);

  // Injecter l'animation CSS si pas encore prÃ©sente
  if (!document.getElementById('dictation-css')) {
    var style = document.createElement('style');
    style.id = 'dictation-css';
    style.textContent = '@keyframes dictPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}';
    document.head.appendChild(style);
  }
}

function updateDictationPanel(interimText, isFinal) {
  var el = document.getElementById('dictation-interim');
  if (!el) return;
  if (!interimText) {
    el.innerHTML = '<span style="color:#475569;">En attente de voix...</span>';
    return;
  }
  // Texte interim en gris, texte final en blanc
  var color = isFinal ? '#f1f5f9' : '#94a3b8';
  var style = isFinal ? '' : 'font-style:italic;';
  el.innerHTML = '<span style="color:' + color + ';' + style + '">' + escapeHtml(interimText) + '</span>';
}

function removeDictationPanel() {
  var panel = document.getElementById('dictation-panel');
  if (panel) panel.remove();
}

function stopDictation() {
  if (!activeDictation) return;
  activeDictation.stopped = true; // empÃƒÆ’Ã‚Âªcher l'auto-relance
  activeDictation.recognition.stop();
}

function toggleDictation(prelId, subIdx) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('La dictÃ©e vocale n\'est pas supportÃ©e par votre navigateur.\n\nUtilisez Chrome sur Android pour cette fonctionnalitÃ©.');
    return;
  }

  var key = prelId + '_' + subIdx;

  // Si dictÃ©e active sur ce mÃƒÆ’Ã‚Âªme champ Ã¢â€ â€™ stop
  if (activeDictation && activeDictation.key === key) {
    stopDictation();
    return;
  }

  // Si dictÃ©e active sur un autre champ Ã¢â€ â€™ stopper proprement d'abord
  if (activeDictation) {
    activeDictation.stopped = true;
    activeDictation.recognition.stop();
    activeDictation = null;
  }

  startDictationSession(prelId, subIdx, key);
}

function startDictationSession(prelId, subIdx, key) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  var textarea = document.getElementById('obs-' + prelId + '-' + subIdx);

  // Texte existant avant de commencer ÃƒÆ’  dicter
  // On sÃ©pare le texte dÃ©jÃƒÆ’  validÃ© du nouveau contenu dictÃ©
  var confirmedText = textarea ? textarea.value : '';
  // SÃ©parateur si texte prÃ©existant
  if (confirmedText && !confirmedText.endsWith(' ') && !confirmedText.endsWith('\n')) {
    confirmedText += ' ';
  }

  var recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  var session = {
    key: key,
    prelId: prelId,
    subIdx: subIdx,
    recognition: recognition,
    confirmedText: confirmedText, // texte validÃ© dÃ©finitivement
    stopped: false
  };

  activeDictation = session;

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ GESTIONNAIRE PRINCIPAL : rÃ©sultats Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  recognition.onresult = function(event) {
    var interimTranscript = '';
    var newFinalText = '';

    for (var i = event.resultIndex; i < event.results.length; i++) {
      var result = event.results[i];
      var transcript = result[0].transcript;

      if (result.isFinal) {
        // RÃ©sultat dÃ©finitif : appliquer les commandes de ponctuation
        newFinalText += applyPonctuationCommands(transcript);
      } else {
        // RÃ©sultat interimaire : affichage uniquement, pas de ponctuation
        interimTranscript += transcript;
      }
    }

    // Accumuler le texte final validÃ©
    if (newFinalText) {
      session.confirmedText += newFinalText;
      // Mettre ÃƒÆ’  jour le champ et sauvegarder
      if (textarea) {
        textarea.value = session.confirmedText;
      }
      updateSubFieldWithAutoDate(prelId, subIdx, 'observations', session.confirmedText);
    }

    // Afficher : texte confirmÃ© + interim en cours
    var displayText = session.confirmedText + interimTranscript;
    if (textarea) {
      textarea.value = displayText;
    }

    // Mettre ÃƒÆ’  jour le panel visuel
    updateDictationPanel(interimTranscript || newFinalText, !interimTranscript);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ FIN DE SESSION : auto-relance si pas stoppÃ© volontairement Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  recognition.onend = function() {
    var btn = document.getElementById('dict-btn-' + prelId + '-' + subIdx);

    if (session.stopped) {
      // ArrÃƒÆ’Ã‚Âªt volontaire
      activeDictation = null;
      if (btn) btn.classList.remove('recording');
      removeDictationPanel();
      // Sauvegarder la valeur finale proprement
      if (textarea) {
        var finalVal = session.confirmedText.trimEnd();
        textarea.value = finalVal;
        updateSubFieldWithAutoDate(prelId, subIdx, 'observations', finalVal);
      }
      return;
    }

    // Auto-relance aprÃƒÆ’Ã‚Â¨s silence (comportement Android Chrome)
    // Petit dÃ©lai pour Ã©viter l'erreur "already started"
    setTimeout(function() {
      if (!session.stopped && activeDictation && activeDictation.key === key) {
        try {
          recognition.start();
        } catch(e) {
          // Si Ã©chec de relance, crÃ©er une nouvelle session
          activeDictation = null;
          if (btn) btn.classList.remove('recording');
          removeDictationPanel();
          startDictationSession(prelId, subIdx, key);
        }
      }
    }, 200);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ERREURS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  recognition.onerror = function(event) {
    var btn = document.getElementById('dict-btn-' + prelId + '-' + subIdx);

    if (event.error === 'no-speech') {
      // Silence : normal sur le terrain, on laisse l'auto-relance gÃ©rer
      return;
    }

    if (event.error === 'aborted') {
      // ArrÃƒÆ’Ã‚Âªt propre, gÃ©rÃ© par onend
      return;
    }

    if (event.error === 'not-allowed') {
      alert('Microphone refusÃ©. VÃ©rifiez les permissions dans les rÃ©glages Chrome.');
      session.stopped = true;
      activeDictation = null;
      if (btn) btn.classList.remove('recording');
      removeDictationPanel();
      return;
    }

    if (event.error === 'network') {
      // Erreur rÃ©seau : tenter de relancer
      return;
    }

    // Autres erreurs : afficher et stopper
    console.warn('DictÃ©e - erreur:', event.error);
    session.stopped = true;
    activeDictation = null;
    if (btn) btn.classList.remove('recording');
    removeDictationPanel();
  };

  // DÃ©marrer
  try {
    recognition.start();
    var btn = document.getElementById('dict-btn-' + prelId + '-' + subIdx);
    if (btn) btn.classList.add('recording');
    showDictationPanel(prelId, subIdx);
  } catch(e) {
    console.error('Impossible de dÃ©marrer la dictÃ©e:', e);
    activeDictation = null;
  }
}


// ===================================================
// TIMERS CT
// ===================================================

var ctTimers = {};

// Retourne l'heure courante au format HH:MM
function getCurrentTimeHHMM() {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function startCTTimer(prelId, subIdx) {
  var key = prelId + '_' + subIdx;
  if (ctTimers[key]) return;

  // Auto-remplir l'heure de dÃ©but dans la premiÃ¨re plage
  var heureDebut = getCurrentTimeHHMM();
  var m = getCurrentMission();
  if (m) {
    var p = m.prelevements.find(function(x) { return x.id === prelId; });
    if (p && p.subPrelevements[subIdx]) {
      var sb = p.subPrelevements[subIdx];
      if (!sb.plages || sb.plages.length === 0) sb.plages = [{debut: '', fin: ''}];
      // Remplir la derniÃ¨re plage sans dÃ©but
      var targetPlage = sb.plages[sb.plages.length - 1];
      if (!targetPlage.debut) {
        targetPlage.debut = heureDebut;
        autoFillDate(p, subIdx);
        saveData('vlep_missions_v3', state.missions);
      }
    }
  }

  ctTimers[key] = {
    prelId: prelId,
    subIdx: subIdx,
    startTime: Date.now(),
    elapsed: 0,
    interval: null
  };

  var t = ctTimers[key];
  t.interval = setInterval(function() {
    t.elapsed = Date.now() - t.startTime;
    var el = document.getElementById('ct-timer-' + key);
    if (el) el.textContent = formatCTTime(t.elapsed);
  }, 1000);

  render();
}

function stopCTTimer(prelId, subIdx) {
  var key = prelId + '_' + subIdx;
  if (!ctTimers[key]) return;
  clearInterval(ctTimers[key].interval);
  delete ctTimers[key];

  // Auto-remplir l'heure de fin dans la derniÃ¨re plage
  var heureFin = getCurrentTimeHHMM();
  var m = getCurrentMission();
  if (m) {
    var p = m.prelevements.find(function(x) { return x.id === prelId; });
    if (p && p.subPrelevements[subIdx]) {
      var sb = p.subPrelevements[subIdx];
      if (sb.plages && sb.plages.length > 0) {
        var targetPlage = sb.plages[sb.plages.length - 1];
        if (!targetPlage.fin) {
          targetPlage.fin = heureFin;
          saveData('vlep_missions_v3', state.missions);
        }
      }
    }
  }

  render();
}

function isTimerRunning(prelId, subIdx) {
  return !!ctTimers[prelId + '_' + subIdx];
}

function formatCTTime(ms) {
  var totalSec = Math.floor(ms / 1000);
  var min = Math.floor(totalSec / 60);
  var sec = totalSec % 60;
  return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
}

function getTimerDisplay(prelId, subIdx) {
  var key = prelId + '_' + subIdx;
  var t = ctTimers[key];
  var elapsed = t ? t.elapsed : 0;
  var pct = Math.min(elapsed / (15 * 60 * 1000) * 100, 100);
  var isOver = elapsed >= 15 * 60 * 1000;

  return [
    '<div class="ct-timer-box" style="background:' + (isOver ? '#fef2f2' : '#f0fdf4') + ';border:2px solid ' + (isOver ? '#ef4444' : '#22c55e') + ';border-radius:10px;padding:12px;margin:8px 0;">',
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">',
        '<span style="font-weight:700;color:' + (isOver ? '#ef4444' : '#16a34a') + ';">⏱ Chrono CT</span>',
        '<span id="ct-timer-' + key + '" style="font-size:24px;font-weight:700;font-family:monospace;color:' + (isOver ? '#ef4444' : '#16a34a') + ';">' + formatCTTime(elapsed) + '</span>',
      '</div>',
      '<div style="background:#e5e7eb;border-radius:4px;height:6px;margin-bottom:10px;">',
        '<div style="background:' + (isOver ? '#ef4444' : '#22c55e') + ';height:6px;border-radius:4px;width:' + pct.toFixed(1) + '%;transition:width 1s;"></div>',
      '</div>',
      (isOver ? '<div style="font-size:11px;color:#ef4444;font-weight:700;text-align:center;margin-bottom:8px;">Ã¢Å¡Â Ã¯Â¸Â 15 min dÃ©passÃ©es</div>' : '<div style="font-size:11px;color:#6b7280;text-align:center;margin-bottom:8px;">DurÃ©e max CT : 15 min</div>'),
      '<button class="btn btn-danger" style="width:100%;" onclick="stopCTTimer(' + prelId + ',' + subIdx + ');">⏹ Arrêter</button>',
    '</div>'
  ].join('');
}

console.log('Ã¢Å“â€ Timers chargÃ©');
