// app.js (обновлённый — улучшенный подбор вариантов)
// Зависит от ./words.js (export const HSK1_WORDS)
import { HSK1_WORDS } from './words.js';

// Simple debug helper prints stack-friendly messages
function dbg(msg, ...rest){ console.log('%c[HSK_DBG] %c'+msg,'color:#fff;background:#0b84ff;padding:2px 6px;border-radius:4px','', ...rest); }

// Local storage keys
const LS_KNOWN = 'hsk_known';

// App elements
const el = id => document.getElementById(id);
const q = sel => document.querySelector(sel);

// State helpers
function loadKnown(){
  try{
    const raw = localStorage.getItem(LS_KNOWN);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('failed to load known words', e);
    return [];
  }
}
function saveKnown(arr){ localStorage.setItem(LS_KNOWN, JSON.stringify(arr)); }

let known = new Set(loadKnown());

// --- Menu
const btnDict = el('btn-dict'), btnCards = el('btn-cards'), btnTest = el('btn-test');
const screenMenu = el('screen-menu');

btnDict.addEventListener('click', ()=>showScreen('dict'));
btnCards.addEventListener('click', ()=>{ if (known.size < 10) return showModal('Для доступа к карточкам нужно отметить минимум 10 слов в словаре.'); showScreen('cards'); });
btnTest.addEventListener('click', ()=>{ if (known.size < 10) return showModal('Для доступа к тесту нужно отметить минимум 10 слов в словаре.'); showScreen('test'); });

// Welcome hint
el('welcome-ok').addEventListener('click', ()=> el('welcome-hint').classList.add('hidden'));

// Screen switcher
function hideAll(){ document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden')); }
function showScreen(name){
  hideAll();
  if(name==='dict') el('screen-dict').classList.remove('hidden');
  if(name==='cards') el('screen-cards').classList.remove('hidden');
  if(name==='test') el('screen-test').classList.remove('hidden');
  if(name==='menu') el('screen-menu').classList.remove('hidden');
  if(name==='dict') renderDict();
}

// --- Dictionary
el('dict-close').addEventListener('click', ()=> showScreen('menu'));
const dictList = el('dict-list'), dictProgress = el('dict-progress'), toTopBtn = el('to-top');

function renderDict(){
  dictList.innerHTML='';
  HSK1_WORDS.forEach(w=>{
    const row = document.createElement('div');
    row.className = 'row' + (known.has(w.id) ? ' known' : '');
    row.innerHTML = `<div class="left"><div class="hanzi">${w.hanzi}</div><div class="pinyin">${w.pinyin} — ${w.russian}</div></div>`;
    const cb = document.createElement('input');
    cb.type='checkbox'; cb.checked = known.has(w.id);
    cb.addEventListener('change', ()=>{
      if(cb.checked) known.add(w.id); else known.delete(w.id);
      saveKnown([...known]);
      row.classList.toggle('known', cb.checked);
      updateProgress();
    });
    row.appendChild(cb);
    dictList.appendChild(row);
  });
  updateProgress();
}
function updateProgress(){
  const percent = Math.round((known.size / HSK1_WORDS.length) * 100);
  dictProgress.textContent = `Вы знаете ${percent}% слов (${known.size}/${HSK1_WORDS.length})`;
}

// scroll to top
dictList.addEventListener('scroll', ()=>{
  if(dictList.scrollTop > 800) toTopBtn.classList.remove('hidden'); else toTopBtn.classList.add('hidden');
});
toTopBtn.addEventListener('click', ()=> dictList.scrollTop = 0);

// --- Cards
el('cards-close').addEventListener('click', ()=> showScreen('menu'));
const cardsStart = el('cards-start'), cardsMode = el('cards-mode');
const cardsArea = el('cards-area'), cardHanzi = el('card-hanzi'), cardPinyin = el('card-pinyin');
const cardOpenBtn = el('card-open'), cardActions = el('card-actions'), addToDictBtn = el('add-to-dict'), cardNextBtn = el('card-next');
const cardsCountEl = el('cards-count');

let cardList = [], cardIndex = 0, cardsPassed = 0;

cardsStart.addEventListener('click', ()=>{
  const mode = cardsMode.value;
  prepareCards(mode);
  startCards();
});

function prepareCards(mode){
  const knownArray = [...known];
  let knownWords = HSK1_WORDS.filter(w=> known.has(w.id));
  let newWords = HSK1_WORDS.filter(w=> !known.has(w.id));
  if(mode==='repeat') cardList = shuffle([...knownWords]);
  else if(mode==='new') cardList = shuffle([...newWords]);
  else { // mix
    cardList = shuffle([...knownWords.slice(0, Math.ceil(HSK1_WORDS.length/2)), ...newWords.slice(0, Math.ceil(HSK1_WORDS.length/2))]);
  }
  if(cardList.length===0) cardList = shuffle(HSK1_WORDS.slice());
  cardIndex = 0; cardsPassed = 0;
  dbg('Prepared cards', {mode, count: cardList.length});
}

function startCards(){
  cardsArea.classList.remove('hidden');
  renderCard();
  cardsCountEl.textContent = `ПРОЙДЕНО СЛОВ: ${cardsPassed}`;
}

function renderCard(){
  const w = cardList[cardIndex];
  if(!w){ cardHanzi.textContent='—'; cardPinyin.textContent='—'; return; }
  cardHanzi.textContent = w.hanzi;
  cardPinyin.textContent = w.pinyin;
  // clear card-main (if before we've injected russian element)
  const cardMain = document.getElementById('card-main');
  if(cardMain){
    cardMain.innerHTML = '';
  }
  cardActions.classList.add('hidden');
  cardOpenBtn.classList.remove('hidden');
  dbg('Render card', w);
}

cardOpenBtn.addEventListener('click', ()=>{
  const w = cardList[cardIndex];
  if(!w) return;
  el('card-open').classList.add('hidden');
  el('card-pinyin').textContent = w.pinyin;
  const rus = document.createElement('div'); rus.textContent = w.russian; rus.style.marginTop='6px';
  const cardMain = document.getElementById('card-main');
  if(cardMain){
    cardMain.innerHTML = '';
    cardMain.appendChild(rus);
  }
  cardActions.classList.remove('hidden');
  addToDictBtn.onclick = ()=>{
    known.add(w.id); saveKnown([...known]); renderDict(); dbg('Added to dict from card', w.id);
  };
  cardNextBtn.onclick = ()=>{
    cardsPassed++;
    cardIndex = (cardIndex + 1) % cardList.length;
    cardsCountEl.textContent = `ПРОЙДЕНО СЛОВ: ${cardsPassed}`;
    // reset card main area
    renderCard();
  };
});

// --- Test settings & run
el('test-close').addEventListener('click', ()=> showScreen('menu'));

const cardsNumEl = el('cards-num'), timeNumEl = el('time-num'), lifeNumEl = el('life-num');
let cardsNum = 10, timeNum = 0, lifeNum = 0; // 0 means infinity in UI
el('cards-incr').addEventListener('click', ()=> { cardsNum = Math.min(50, cardsNum+5); cardsNumEl.textContent = cardsNum; });
el('cards-decr').addEventListener('click', ()=> { cardsNum = Math.max(1, cardsNum-5); cardsNumEl.textContent = cardsNum; });
el('time-incr').addEventListener('click', ()=> { if(timeNum===0) timeNum=30; else timeNum = Math.min(120, timeNum+30); timeNumEl.textContent = timeNum===0?'∞':timeNum; });
el('time-decr').addEventListener('click', ()=> { if(timeNum<=30) timeNum=0; else timeNum = Math.max(30, timeNum-30); timeNumEl.textContent = timeNum===0?'∞':timeNum; });
el('life-incr').addEventListener('click', ()=> { if(lifeNum===0) lifeNum=1; else lifeNum = Math.min( (cardsNum+1), lifeNum+1); lifeNumEl.textContent = lifeNum===0?'∞':lifeNum; });
el('life-decr').addEventListener('click', ()=> { if(lifeNum<=1) lifeNum=0; else lifeNum = Math.max(1, lifeNum-1); lifeNumEl.textContent = lifeNum===0?'∞':lifeNum; });

el('start-test').addEventListener('click', ()=>{
  const mode = el('test-mode').value;
  const cardSide = el('card-side').value;
  const optionSide = el('option-side').value;
  const hints = el('hints-select').value === 'yes';
  if(cardSide === optionSide){ return showModal('Карточки и варианты не могут быть в одном и том же формате. Выберите разные.'); }
  startTest({mode, cardSide, optionSide, hints, cardsNum, timeNum, lifeNum});
});

// test runtime
let testState = null, testTimer = null;

function startTest(opts){
  dbg('Starting test', opts);
  // build pool
  let pool = [];
  if(opts.mode==='repeat') pool = HSK1_WORDS.filter(w=> known.has(w.id));
  else if(opts.mode==='new') pool = HSK1_WORDS.filter(w=> !known.has(w.id));
  else pool = HSK1_WORDS.slice();
  if(pool.length===0) pool = HSK1_WORDS.slice();
  pool = shuffle(pool).slice(0, Math.min(opts.cardsNum, pool.length));
  testState = {
    opts, pool, index:0, correct:0, wrong:[], lives: opts.lifeNum===0?Infinity:opts.lifeNum, timeLeft: opts.timeNum, startTS: Date.now()
  };
  // UI
  el('test-area').classList.remove('hidden');
  el('test-area').scrollIntoView();
  renderQuestion();
  // timer
  if(testTimer) clearInterval(testTimer);
  if(opts.timeNum>0){
    updateTimerDisplay(testState.timeLeft);
    testTimer = setInterval(()=>{
      testState.timeLeft--;
      updateTimerDisplay(testState.timeLeft);
      if(testState.timeLeft<=0){ clearInterval(testTimer); endTest(false); }
    }, 1000);
  } else {
    updateTimerDisplay(null);
  }
  updateMeta();
}

function updateTimerDisplay(val){
  const elTimer = el('timer');
  if(val===null) { elTimer.textContent = 'Время: —'; elTimer.style.color=''; return; }
  elTimer.textContent = `Время: ${val}s`;
  // color thresholds: 50% -> orange, last 10s -> red
  const max = parseInt(el('time-num').textContent==='∞'?0:el('time-num').textContent) || 0;
  if(max>0 && val <= Math.floor(max/2)) elTimer.style.color='orange'; else elTimer.style.color='';
  if(val<=10) elTimer.style.color='red';
}

function updateMeta(){
  el('cards-left').textContent = `Осталось карточек: ${testState.pool.length - testState.index}`;
  el('lives-left').textContent = `Жизни: ${isFinite(testState.lives)?testState.lives:'∞'}`;
}

function renderQuestion(){
  const cur = testState.pool[testState.index];
  const cs = testState.opts.cardSide, os = testState.opts.optionSide;
  // build options WITH smart selection
  const options = makeSmartOptions(cur, os);
  // render main
  const main = el('q-main');
  main.textContent = formatSide(cur, cs);
  const optsEl = el('options'); optsEl.innerHTML='';
  options.forEach((opt, idx)=>{
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = formatSide(opt, os);
    btn.onclick = ()=>onAnswer(btn, opt, cur);
    optsEl.appendChild(btn);
  });
  dbg('Question', {cur, options});
  updateMeta();
}

function onAnswer(btn, chosen, correct){
  if(btn.classList.contains('disabled')) return;
  const hints = testState.opts.hints;
  if(isSame(chosen, correct, testState.opts.optionSide)){
    btn.classList.add('correct');
    testState.correct++;
    setTimeout(()=>{
      nextQuestion();
    }, 500);
  } else {
    btn.classList.add('wrong');
    if(hints){
      // reveal correct as hint
      const correctBtn = Array.from(document.querySelectorAll('.option')).find(o => o.textContent===formatSide(correct, testState.opts.optionSide));
      if(correctBtn) correctBtn.classList.add('hint');
      // decrease life on second wrong click
      btn.onclick = ()=>{ btn.classList.add('wrong'); if(isFinite(testState.lives)) testState.lives--; if(testState.lives<=0){ endTest(false); return;} document.querySelectorAll('.option').forEach(o=>o.classList.add('disabled')); setTimeout(()=> nextQuestion(), 200); updateMeta(); };
    } else {
      // decrease life immediately
      if(isFinite(testState.lives)) testState.lives--;
      if(testState.lives<=0){ endTest(false); return; }
      btn.onclick = ()=> { document.querySelectorAll('.option').forEach(o=>o.classList.add('disabled')); setTimeout(()=> nextQuestion(), 200); };
      updateMeta();
    }
  }
}

function nextQuestion(){
  testState.index++;
  if(testState.index >= testState.pool.length){ endTest(true); return; }
  renderQuestion();
}

function endTest(win){
  if(testTimer) clearInterval(testTimer);
  const total = testState.pool.length;
  const correct = testState.correct;
  const elapsed = Math.floor((Date.now() - testState.startTS)/1000);
  showModal(win?`Поздравляем, тест пройден!<br>Карточек отвечено: ${correct}/${total}<br>Секунд затрачено: ${elapsed}`:`Тест не пройден!<br>Карточек отвечено: ${correct}/${total}<br>Секунд затрачено: ${elapsed}`,
    [{text:'Заново', cb:()=>{ startTest(testState.opts); }},{text:'Меню', cb:()=>{ showScreen('menu'); el('test-area').classList.add('hidden'); }}]);
}

// --- smart options generator ---

// Normalize pinyin: remove diacritics and spaces (so 'Běijīng' -> 'beijing', 'dǎ diànhuà' -> 'dadianhua' or better 'da dianhua' -> 'dadianhua')
// We'll remove diacritics and also collapse spaces to nothing for base comparison.
// Mapping table for common pinyin diacritics:
const DIACRITIC_MAP = {
  'ā':'a','á':'a','ǎ':'a','à':'a',
  'ē':'e','é':'e','ě':'e','è':'e',
  'ī':'i','í':'i','ǐ':'i','ì':'i',
  'ō':'o','ó':'o','ǒ':'o','ò':'o',
  'ū':'u','ú':'u','ǔ':'u','ù':'u',
  'ǖ':'ü','ǘ':'ü','ǚ':'ü','ǜ':'ü',
  'Ā':'A','Á':'A','Ǎ':'A','À':'A',
  'Ē':'E','É':'E','Ě':'E','È':'E',
  'Ī':'I','Í':'I','Ǐ':'I','Ì':'I',
  'Ō':'O','Ó':'O','Ǒ':'O','Ò':'O',
  'Ū':'U','Ú':'U','Ǔ':'U','Ù':'U',
  'Ǖ':'Ü','Ǘ':'Ü','Ǚ':'Ü','Ǜ':'Ü'
};
function normalizePinyin(s){
  if(!s) return '';
  // replace diacritics
  let out = '';
  for(const ch of s){
    if(DIACRITIC_MAP[ch]) out += DIACRITIC_MAP[ch];
    else out += ch;
  }
  // lower, remove spaces and apostrophes for base comparison
  return out.toLowerCase().replace(/[\s'’`]+/g,'');
}
// for first-syllable matching (e.g. "dadianhua" -> "da" roughly), we'll take up to first vowel group
function pinyinFirstSyllable(s){
  const norm = normalizePinyin(s);
  // naive: take characters until next vowel after first vowel cluster ends
  const m = norm.match(/^[^aeiouü]*[aeiouü]+/i);
  return m ? m[0] : norm;
}

// hanzi similarity: count shared characters (excluding spaces)
function sharedHanziCount(a,b){
  if(!a || !b) return 0;
  const sa = new Set(a.replace(/\s+/g,'').split(''));
  const sb = new Set(b.replace(/\s+/g,'').split(''));
  let cnt = 0;
  sa.forEach(ch => { if(sb.has(ch)) cnt++; });
  return cnt;
}

// russian tokens intersection
function rusTokens(s){
  if(!s) return [];
  return s.toLowerCase().split(/[^а-яёa-z0-9]+/i).filter(Boolean);
}
function tokenOverlap(a,b){
  const A = new Set(rusTokens(a));
  const B = new Set(rusTokens(b));
  let cnt = 0;
  A.forEach(t=>{ if(B.has(t)) cnt++; });
  return cnt;
}

function makeSmartOptions(cur, side){
  // cur: word object
  // side: 'hanzi' | 'pinyin' | 'russian'
  const pool = HSK1_WORDS.slice();
  const candidates = pool.filter(p => p.id !== cur.id);
  let picked = [];

  if(side === 'pinyin'){
    const normCur = normalizePinyin(cur.pinyin);
    // 1) same normalized pinyin but different tone marks (i.e. format differs)
    const sameBase = candidates.filter(c => normalizePinyin(c.pinyin) === normCur && c.pinyin !== cur.pinyin);
    shuffle(sameBase);
    picked = picked.concat(sameBase.slice(0,3));
    // 2) if not enough, pick same first syllable but different whole pinyin
    if(picked.length < 3){
      const first = pinyinFirstSyllable(cur.pinyin);
      const sameFirst = candidates.filter(c => pinyinFirstSyllable(c.pinyin) === first && normalizePinyin(c.pinyin) !== normCur && !picked.includes(c));
      shuffle(sameFirst);
      picked = picked.concat(sameFirst.slice(0, 3 - picked.length));
    }
    // 3) fallback random
    if(picked.length < 3){
      const remain = shuffle(candidates.filter(c=> !picked.includes(c)));
      picked = picked.concat(remain.slice(0, 3 - picked.length));
    }
  } else if(side === 'hanzi'){
    // 1) prefer words that share any hanzi character
    const withShared = candidates
      .map(c => ({c, shared: sharedHanziCount(cur.hanzi, c.hanzi)}))
      .filter(x => x.shared > 0)
      .sort((a,b)=> b.shared - a.shared)
      .map(x => x.c);
    shuffle(withShared);
    picked = picked.concat(withShared.slice(0,3));
    // 2) then words with same length
    if(picked.length < 3){
      const sameLen = shuffle(candidates.filter(c=> c.hanzi.length === cur.hanzi.length && !picked.includes(c)));
      picked = picked.concat(sameLen.slice(0, 3 - picked.length));
    }
    // 3) fallback random
    if(picked.length < 3){
      const remain = shuffle(candidates.filter(c=> !picked.includes(c)));
      picked = picked.concat(remain.slice(0, 3 - picked.length));
    }
  } else { // russian
    // 1) words that share russian tokens
    const withOverlap = candidates
      .map(c => ({c, overlap: tokenOverlap(cur.russian, c.russian)}))
      .filter(x => x.overlap > 0)
      .sort((a,b)=> b.overlap - a.overlap)
      .map(x => x.c);
    shuffle(withOverlap);
    picked = picked.concat(withOverlap.slice(0,3));
    // 2) if still short: choose words with at least one common character in hanzi (visual similar)
    if(picked.length < 3){
      const byHanzi = shuffle(candidates.filter(c=> sharedHanziCount(cur.hanzi, c.hanzi) > 0 && !picked.includes(c)));
      picked = picked.concat(byHanzi.slice(0, 3 - picked.length));
    }
    // 3) fallback random
    if(picked.length < 3){
      const remain = shuffle(candidates.filter(c=> !picked.includes(c)));
      picked = picked.concat(remain.slice(0, 3 - picked.length));
    }
  }

  // Ensure uniqueness and include the correct one
  const unique = [];
  const ids = new Set();
  // add correct
  unique.push(cur); ids.add(cur.id);
  for(const p of picked){
    if(!ids.has(p.id)){
      unique.push(p); ids.add(p.id);
    }
    if(unique.length >= 4) break;
  }
  // final safety: if still <4, fill with random distinct
  if(unique.length < 4){
    const others = shuffle(HSK1_WORDS.filter(w=> !ids.has(w.id)));
    while(unique.length < 4 && others.length) unique.push(others.shift());
  }
  return shuffle(unique); // randomize order
}

// --- helpers ---
function formatSide(item, side){
  if(side==='hanzi') return item.hanzi;
  if(side==='pinyin') return item.pinyin;
  return item.russian;
}
function isSame(a,b,side){ return formatSide(a,side) === formatSide(b,side); }

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

// --- modal and UI helpers (unchanged) ---
function showModal(message, actions){
  const m = el('modal'); m.innerHTML = ''; m.classList.remove('hidden');
  const box = document.createElement('div'); box.className='box'; box.innerHTML = `<div>${message}</div>`;
  const controls = document.createElement('div'); controls.style.marginTop='12px'; controls.style.display='flex'; controls.style.gap='8px'; controls.style.justifyContent='flex-end';
  const ok = document.createElement('button'); ok.className='small-btn'; ok.textContent = 'ОК'; ok.onclick = ()=> { m.classList.add('hidden'); if(actions && actions.length===1) actions[0].cb(); };
  controls.appendChild(ok);
  if(Array.isArray(actions)){
    actions.forEach(a=>{ const b=document.createElement('button'); b.className='small-btn'; b.textContent=a.text; b.onclick=()=>{ m.classList.add('hidden'); if(a.cb) a.cb(); }; controls.appendChild(b); });
  }
  box.appendChild(controls); m.appendChild(box);
}

// init
renderDict();
dbg('App initialized', {knownCount: known.size});
