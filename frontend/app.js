// ===== ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ HSK-ТРЕНЕР =====
// Основной файл приложения для изучения китайского языка уровня HSK-1
// Зависит от ./words.js (экспорт константы HSK1_WORDS с базой слов)
import { HSK1_WORDS } from './words.js';  // Импортируем базу слов HSK-1 уровня

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
// Функция для отладочного вывода с красивым форматированием в консоли
function dbg(msg, ...rest){ 
  console.log('%c[HSK_DBG] %c'+msg,'color:#fff;background:#0b84ff;padding:2px 6px;border-radius:4px','', ...rest); 
}

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
// Флаг инициализации приложения (проверка подписок и доступа)
let appInitialized = false;
// Флаг разрешения доступа к функциям приложения после проверки подписок
let accessGranted = false;

// ===== КОНСТАНТЫ ЛОКАЛЬНОГО ХРАНИЛИЩА =====
// Ключ для сохранения списка изученных слов в localStorage
const LS_KNOWN = 'hsk_known';

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ DOM =====
// Быстрый доступ к элементу по ID
const el = id => document.getElementById(id);
// Быстрый доступ к элементу по CSS селектору
const q = sel => document.querySelector(sel);

// ===== ФУНКЦИИ РАБОТЫ С ИЗУЧЕННЫМИ СЛОВАМИ =====
// Загружает список изученных слов из localStorage
function loadKnown(){
  try{
    const raw = localStorage.getItem(LS_KNOWN);  // Получаем данные из localStorage
    return raw ? JSON.parse(raw) : [];           // Парсим JSON или возвращаем пустой массив
  }catch(e){
    console.error('failed to load known words', e);  // Логируем ошибку парсинга
    return [];  // Возвращаем пустой массив при ошибке
  }
}
// Сохраняет список изученных слов в localStorage
function saveKnown(arr){ 
  localStorage.setItem(LS_KNOWN, JSON.stringify(arr));  // Сериализуем и сохраняем массив
}

// Множество изученных слов для быстрого поиска (Set обеспечивает O(1) поиск)
let known = new Set(loadKnown());

// ===== ЭЛЕМЕНТЫ ГЛАВНОГО МЕНЮ =====
// Кнопки навигации по основным разделам приложения
const btnDict = el('btn-dict'),     // Кнопка "Словарь" - просмотр всех слов HSK-1
      btnCards = el('btn-cards'),   // Кнопка "Карточки" - режим изучения слов
      btnTest = el('btn-test');     // Кнопка "Тест" - проверка знаний
const screenMenu = el('screen-menu'); // Главный экран меню

// Обработчики кнопок будут добавлены позже с контролем доступа

// ===== ПРИВЕТСТВЕННОЕ СООБЩЕНИЕ =====
// Скрытие приветственной подсказки при нажатии "ОК"
el('welcome-ok').addEventListener('click', ()=> el('welcome-hint').classList.add('hidden'));

// ===== СИСТЕМА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ =====
// Скрывает все экраны приложения (добавляет класс 'hidden')
function hideAll(){ 
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden')); 
}
// Показывает указанный экран и скрывает остальные
function showScreen(name){
  hideAll();  // Сначала скрываем все экраны
  // Показываем нужный экран в зависимости от переданного имени
  if(name==='dict') el('screen-dict').classList.remove('hidden');     // Экран словаря
  if(name==='cards') el('screen-cards').classList.remove('hidden');   // Экран карточек
  if(name==='test') el('screen-test').classList.remove('hidden');     // Экран теста
  if(name==='menu') el('screen-menu').classList.remove('hidden');     // Главное меню
  if(name==='dict') renderDict();  // При открытии словаря сразу рендерим его содержимое
}

// ===== РАЗДЕЛ СЛОВАРЯ =====
// Кнопка закрытия словаря - возврат в главное меню
el('dict-close').addEventListener('click', ()=> showScreen('menu'));

// Элементы интерфейса словаря
const dictList = el('dict-list'),         // Контейнер со списком всех слов
      dictProgress = el('dict-progress'), // Элемент отображения прогресса изучения
      toTopBtn = el('to-top');            // Кнопка "Наверх" для длинного списка

// Функция отрисовки словаря со всеми словами HSK-1
function renderDict(){
  dictList.innerHTML='';  // Очищаем контейнер перед заполнением
  
  // Проходим по всем словам из базы HSK1_WORDS
  HSK1_WORDS.forEach(w=>{
    // Создаем строку для каждого слова
    const row = document.createElement('div');
    // Добавляем класс 'known' если слово уже изучено
    row.className = 'row' + (known.has(w.id) ? ' known' : '');
    
    // Заполняем содержимое строки: иероглифы, пиньинь и перевод
    row.innerHTML = `<div class="left"><div class="hanzi">${w.hanzi}</div><div class="pinyin">${w.pinyin} — ${w.russian}</div></div>`;
    
    // Создаем чекбокс для отметки "знаю/не знаю"
    const cb = document.createElement('input');
    cb.type='checkbox'; 
    cb.checked = known.has(w.id);  // Устанавливаем состояние чекбокса
    
    // Обработчик изменения состояния чекбокса
    cb.addEventListener('change', ()=>{
      if(cb.checked) known.add(w.id); else known.delete(w.id);  // Добавляем/удаляем из изученных
      saveKnown([...known]);                    // Сохраняем изменения в localStorage
      row.classList.toggle('known', cb.checked); // Обновляем визуальное состояние строки
      updateProgress();                         // Обновляем счетчик прогресса
    });
    
    row.appendChild(cb);      // Добавляем чекбокс к строке
    dictList.appendChild(row); // Добавляем строку в список
  });
  updateProgress();  // Обновляем прогресс после отрисовки
}

// Функция обновления отображения прогресса изучения
function updateProgress(){
  const percent = Math.round((known.size / HSK1_WORDS.length) * 100);  // Вычисляем процент
  dictProgress.textContent = `Вы знаете ${percent}% слов (${known.size}/${HSK1_WORDS.length})`;
}

// ===== ФУНКЦИЯ ПРОКРУТКИ К НАЧАЛУ СПИСКА =====
// Показываем кнопку "Наверх" при прокрутке вниз более чем на 800px
dictList.addEventListener('scroll', ()=>{
  if(dictList.scrollTop > 800) toTopBtn.classList.remove('hidden'); 
  else toTopBtn.classList.add('hidden');
});
// Прокрутка к началу списка при нажатии кнопки
toTopBtn.addEventListener('click', ()=> dictList.scrollTop = 0);

// ===== РАЗДЕЛ КАРТОЧЕК =====
// Кнопка закрытия карточек - возврат в главное меню
el('cards-close').addEventListener('click', ()=> showScreen('menu'));

// Элементы интерфейса карточек
const cardsStart = el('cards-start'),   // Кнопка "Начать" для запуска режима карточек
      cardsMode = el('cards-mode');     // Селектор режима: повторение/новые/смешанный
const cardsArea = el('cards-area'),     // Область отображения карточки
      cardHanzi = el('card-hanzi'),     // Элемент для отображения иероглифов
      cardPinyin = el('card-pinyin');   // Элемент для отображения пиньинь
const cardOpenBtn = el('card-open'),    // Кнопка "Открыть" для показа перевода
      cardActions = el('card-actions'), // Контейнер с действиями (знаю/не знаю)
      addToDictBtn = el('add-to-dict'), // Кнопка "Знаю" - добавить в изученные
      cardNextBtn = el('card-next');    // Кнопка "Следующая" карточка
const cardsCountEl = el('cards-count'); // Счетчик пройденных карточек

// ===== СОСТОЯНИЕ РЕЖИМА КАРТОЧЕК =====
let cardList = [],    // Массив карточек для текущей сессии
    cardIndex = 0,    // Индекс текущей карточки
    cardsPassed = 0;  // Количество пройденных карточек

// Обработчик запуска режима карточек
cardsStart.addEventListener('click', ()=>{
  const mode = cardsMode.value;  // Получаем выбранный режим
  prepareCards(mode);            // Подготавливаем список карточек
  startCards();                  // Запускаем показ карточек
});

// Функция подготовки списка карточек в зависимости от выбранного режима
function prepareCards(mode){
  const knownArray = [...known];  // Преобразуем Set в массив для удобства
  
  // Разделяем слова на изученные и новые
  let knownWords = HSK1_WORDS.filter(w=> known.has(w.id));   // Слова, которые пользователь уже знает
  let newWords = HSK1_WORDS.filter(w=> !known.has(w.id));    // Новые слова для изучения
  
  // Формируем список карточек в зависимости от режима
  if(mode==='repeat') {
    // Режим "Повторение" - только изученные слова
    cardList = shuffle([...knownWords]);
  } else if(mode==='new') {
    // Режим "Новые" - только неизученные слова
    cardList = shuffle([...newWords]);
  } else { 
    // Режим "Смешанный" - комбинация изученных и новых слов
    cardList = shuffle([
      ...knownWords.slice(0, Math.ceil(HSK1_WORDS.length/2)), 
      ...newWords.slice(0, Math.ceil(HSK1_WORDS.length/2))
    ]);
  }
  
  // Если список пуст (например, нет изученных слов в режиме "Повторение"),
  // используем все слова из базы
  if(cardList.length===0) cardList = shuffle(HSK1_WORDS.slice());
  
  // Сбрасываем счетчики для новой сессии
  cardIndex = 0; 
  cardsPassed = 0;
  
  dbg('Prepared cards', {mode, count: cardList.length});  // Отладочная информация
}

// Функция запуска показа карточек
function startCards(){
  cardsArea.classList.remove('hidden');                        // Показываем область карточек
  renderCard();                                                // Отображаем первую карточку
  cardsCountEl.textContent = `ПРОЙДЕНО СЛОВ: ${cardsPassed}`;  // Обновляем счетчик
}

// Функция отрисовки текущей карточки
function renderCard(){
  const w = cardList[cardIndex];  // Получаем текущее слово из списка
  
  // Если слово не найдено (конец списка), показываем заглушки
  if(!w){ 
    cardHanzi.textContent='—'; 
    cardPinyin.textContent='—'; 
    return; 
  }
  
  // Отображаем иероглифы и пиньинь
  cardHanzi.textContent = w.hanzi;
  cardPinyin.textContent = w.pinyin;
  
  // Очищаем область карточки от предыдущего содержимого (например, перевода)
  const cardMain = document.getElementById('card-main');
  if(cardMain){
    cardMain.innerHTML = '';
  }
  
  // Скрываем действия и показываем кнопку "Открыть"
  cardActions.classList.add('hidden');
  cardOpenBtn.classList.remove('hidden');
  
  dbg('Render card', w);  // Отладочная информация
}

// ===== ОБРАБОТЧИК КНОПКИ "ОТКРЫТЬ" КАРТОЧКУ =====
cardOpenBtn.addEventListener('click', ()=>{
  const w = cardList[cardIndex];  // Получаем текущее слово
  if(!w) return;  // Если слово не найдено, выходим
  
  // Скрываем кнопку "Открыть" и показываем перевод
  el('card-open').classList.add('hidden');
  el('card-pinyin').textContent = w.pinyin;  // Обновляем пиньинь (на всякий случай)
  
  // Создаем элемент с русским переводом
  const rus = document.createElement('div'); 
  rus.textContent = w.russian; 
  rus.style.marginTop='6px';
  
  // Добавляем перевод в основную область карточки
  const cardMain = document.getElementById('card-main');
  if(cardMain){
    cardMain.innerHTML = '';      // Очищаем область
    cardMain.appendChild(rus);    // Добавляем перевод
  }
  
  // Показываем кнопки действий ("Знаю" / "Следующая")
  cardActions.classList.remove('hidden');
  
  // ===== ОБРАБОТЧИК КНОПКИ "ЗНАЮ" =====
  addToDictBtn.onclick = ()=>{
    known.add(w.id);           // Добавляем слово в изученные
    saveKnown([...known]);     // Сохраняем в localStorage
    renderDict();              // Обновляем словарь (если он открыт)
    dbg('Added to dict from card', w.id);  // Отладочная информация
  };
  
  // ===== ОБРАБОТЧИК КНОПКИ "СЛЕДУЮЩАЯ" =====
  cardNextBtn.onclick = ()=>{
    cardsPassed++;  // Увеличиваем счетчик пройденных карточек
    cardIndex = (cardIndex + 1) % cardList.length;  // Переходим к следующей карточке (циклично)
    cardsCountEl.textContent = `ПРОЙДЕНО СЛОВ: ${cardsPassed}`;  // Обновляем счетчик
    renderCard();  // Отображаем следующую карточку
  };
});

// ===== РАЗДЕЛ НАСТРОЕК И ЗАПУСКА ТЕСТА =====
// Кнопка закрытия теста - возврат в главное меню
el('test-close').addEventListener('click', ()=> showScreen('menu'));

// Элементы отображения настроек теста
const cardsNumEl = el('cards-num'),   // Элемент отображения количества вопросов
      timeNumEl = el('time-num'),     // Элемент отображения времени на тест
      lifeNumEl = el('life-num');     // Элемент отображения количества жизней

// Переменные настроек теста (0 означает бесконечность в интерфейсе)
let cardsNum = 10,  // Количество вопросов в тесте
    timeNum = 0,    // Время на тест в секундах (0 = без ограничений)
    lifeNum = 0;    // Количество жизней (0 = без ограничений)

// ===== ОБРАБОТЧИКИ КНОПОК НАСТРОЙКИ КОЛИЧЕСТВА ВОПРОСОВ =====
el('cards-incr').addEventListener('click', ()=> { 
  cardsNum = Math.min(50, cardsNum+5);  // Увеличиваем на 5, максимум 50
  cardsNumEl.textContent = cardsNum; 
});
el('cards-decr').addEventListener('click', ()=> { 
  cardsNum = Math.max(1, cardsNum-5);   // Уменьшаем на 5, минимум 1
  cardsNumEl.textContent = cardsNum; 
});

// ===== ОБРАБОТЧИКИ КНОПОК НАСТРОЙКИ ВРЕМЕНИ =====
el('time-incr').addEventListener('click', ()=> { 
  if(timeNum===0) timeNum=30; else timeNum = Math.min(120, timeNum+30);  // Увеличиваем на 30 сек, максимум 120
  timeNumEl.textContent = timeNum===0?'∞':timeNum; 
});
el('time-decr').addEventListener('click', ()=> { 
  if(timeNum<=30) timeNum=0; else timeNum = Math.max(30, timeNum-30);    // Уменьшаем на 30 сек, минимум 0 (∞)
  timeNumEl.textContent = timeNum===0?'∞':timeNum; 
});

// ===== ОБРАБОТЧИКИ КНОПОК НАСТРОЙКИ ЖИЗНЕЙ =====
el('life-incr').addEventListener('click', ()=> { 
  if(lifeNum===0) lifeNum=1; else lifeNum = Math.min( (cardsNum+1), lifeNum+1);  // Увеличиваем, максимум = количество вопросов + 1
  lifeNumEl.textContent = lifeNum===0?'∞':lifeNum; 
});
el('life-decr').addEventListener('click', ()=> { 
  if(lifeNum<=1) lifeNum=0; else lifeNum = Math.max(1, lifeNum-1);              // Уменьшаем, минимум 0 (∞)
  lifeNumEl.textContent = lifeNum===0?'∞':lifeNum; 
});

// ===== ОБРАБОТЧИК КНОПКИ "НАЧАТЬ ТЕСТ" =====
el('start-test').addEventListener('click', ()=>{
  // Получаем настройки теста из интерфейса
  const mode = el('test-mode').value;        // Режим: repeat/new/mixed
  const cardSide = el('card-side').value;    // Что показывать в вопросе: hanzi/pinyin/russian
  const optionSide = el('option-side').value; // Что показывать в вариантах ответов
  const hints = el('hints-select').value === 'yes'; // Включены ли подсказки
  
  // Проверяем корректность настроек
  if(cardSide === optionSide){ 
    return showModal('Карточки и варианты не могут быть в одном и том же формате. Выберите разные.'); 
  }
  
  // Запускаем тест с выбранными настройками
  startTest({mode, cardSide, optionSide, hints, cardsNum, timeNum, lifeNum});
});

// ===== ПЕРЕМЕННЫЕ СОСТОЯНИЯ ТЕСТА =====
let testState = null,  // Объект с текущим состоянием теста
    testTimer = null;  // Таймер для ограничения времени

// ===== ФУНКЦИЯ ЗАПУСКА ТЕСТА =====
function startTest(opts){
  dbg('Starting test', opts);  // Отладочная информация
  
  // ===== ФОРМИРОВАНИЕ ПУЛА СЛОВ ДЛЯ ТЕСТА =====
  let pool = [];
  if(opts.mode==='repeat') {
    // Режим "Повторение" - только изученные слова
    pool = HSK1_WORDS.filter(w=> known.has(w.id));
  } else if(opts.mode==='new') {
    // Режим "Новые" - только неизученные слова
    pool = HSK1_WORDS.filter(w=> !known.has(w.id));
  } else {
    // Режим "Смешанный" - все слова
    pool = HSK1_WORDS.slice();
  }
  
  // Если пул пустой (например, нет изученных слов), используем все слова
  if(pool.length===0) pool = HSK1_WORDS.slice();
  
  // Перемешиваем и ограничиваем количество слов настройками
  pool = shuffle(pool).slice(0, Math.min(opts.cardsNum, pool.length));
  
  // ===== ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ ТЕСТА =====
  testState = {
    opts,                                                    // Настройки теста
    pool,                                                    // Массив слов для теста
    index: 0,                                               // Индекс текущего вопроса
    correct: 0,                                             // Количество правильных ответов
    wrong: [],                                              // Массив неправильных ответов
    lives: opts.lifeNum===0 ? Infinity : opts.lifeNum,     // Количество жизней
    timeLeft: opts.timeNum,                                 // Оставшееся время
    startTS: Date.now()                                     // Время начала теста
  };
  
  // ===== НАСТРОЙКА ИНТЕРФЕЙСА =====
  el('test-area').classList.remove('hidden');  // Показываем область теста
  el('test-area').scrollIntoView();            // Прокручиваем к области теста
  renderQuestion();                            // Отображаем первый вопрос
  
  // ===== НАСТРОЙКА ТАЙМЕРА =====
  if(testTimer) clearInterval(testTimer);      // Очищаем предыдущий таймер
  if(opts.timeNum > 0){                        // Если установлено ограничение времени
    updateTimerDisplay(testState.timeLeft);    // Обновляем отображение таймера
    testTimer = setInterval(()=>{
      testState.timeLeft--;                    // Уменьшаем оставшееся время
      updateTimerDisplay(testState.timeLeft);  // Обновляем отображение
      if(testState.timeLeft <= 0){             // Если время вышло
        clearInterval(testTimer);              // Останавливаем таймер
        endTest(false);                        // Завершаем тест (неуспешно)
      }
    }, 1000);
  } else {
    // Если таймер не установлен, показываем "—"
    updateTimerDisplay(null);
  }
  updateMeta();  // Обновляем метаинформацию (счетчики)
}

// ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ОТОБРАЖЕНИЯ ТАЙМЕРА =====
function updateTimerDisplay(val){
  const elTimer = el('timer');
  
  // Если значение null, показываем прочерк
  if(val===null) { 
    elTimer.textContent = 'Время: —'; 
    elTimer.style.color=''; 
    return; 
  }
  
  // Отображаем оставшееся время
  elTimer.textContent = `Время: ${val}s`;
  
  // ===== ЦВЕТОВЫЕ ИНДИКАТОРЫ ВРЕМЕНИ =====
  const max = parseInt(el('time-num').textContent==='∞'?0:el('time-num').textContent) || 0;
  
  // Оранжевый цвет при 50% времени
  if(max>0 && val <= Math.floor(max/2)) {
    elTimer.style.color='orange'; 
  } else {
    elTimer.style.color='';
  }
  
  // Красный цвет в последние 10 секунд
  if(val<=10) elTimer.style.color='red';
}

// ===== ФУНКЦИЯ ОБНОВЛЕНИЯ МЕТАИНФОРМАЦИИ ТЕСТА =====
function updateMeta(){
  // Обновляем счетчик оставшихся карточек
  el('cards-left').textContent = `Осталось карточек: ${testState.pool.length - testState.index}`;
  
  // Обновляем счетчик жизней (∞ если безлимитный режим)
  el('lives-left').textContent = `Жизни: ${isFinite(testState.lives)?testState.lives:'∞'}`;
}

// ===== ФУНКЦИЯ ОТОБРАЖЕНИЯ ВОПРОСА =====
function renderQuestion(){
  const cur = testState.pool[testState.index];  // Текущее слово
  const cs = testState.opts.cardSide;          // Сторона карточки (что показывать в вопросе)
  const os = testState.opts.optionSide;        // Сторона вариантов (что показывать в ответах)
  
  // ===== ГЕНЕРАЦИЯ УМНЫХ ВАРИАНТОВ ОТВЕТОВ =====
  const options = makeSmartOptions(cur, os);
  
  // ===== ОТОБРАЖЕНИЕ ОСНОВНОГО ВОПРОСА =====
  const main = el('q-main');
  main.textContent = formatSide(cur, cs);  // Показываем слово в выбранном формате
  
  // ===== СОЗДАНИЕ КНОПОК С ВАРИАНТАМИ ОТВЕТОВ =====
  const optsEl = el('options'); 
  optsEl.innerHTML='';  // Очищаем предыдущие варианты
  
  options.forEach((opt, idx)=>{
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = formatSide(opt, os);  // Показываем вариант в выбранном формате
    btn.onclick = ()=>onAnswer(btn, opt, cur);  // Обработчик клика по варианту
    optsEl.appendChild(btn);
  });
  
  dbg('Question', {cur, options});  // Отладочная информация
  updateMeta();  // Обновляем метаинформацию
}

// ===== ФУНКЦИЯ ОБРАБОТКИ ОТВЕТА ПОЛЬЗОВАТЕЛЯ =====
function onAnswer(btn, chosen, correct){
  // Игнорируем клики по отключенным кнопкам
  if(btn.classList.contains('disabled')) return;
  
  const hints = testState.opts.hints;  // Включены ли подсказки
  
  // ===== ПРАВИЛЬНЫЙ ОТВЕТ =====
  if(isSame(chosen, correct, testState.opts.optionSide)){
    btn.classList.add('correct');  // Подсвечиваем кнопку зеленым
    testState.correct++;           // Увеличиваем счетчик правильных ответов
    
    // Переходим к следующему вопросу через 500мс
    setTimeout(()=>{
      nextQuestion();
    }, 500);
    
  // ===== НЕПРАВИЛЬНЫЙ ОТВЕТ =====
  } else {
    btn.classList.add('wrong');  // Подсвечиваем кнопку красным
    
    // ===== РЕЖИМ С ПОДСКАЗКАМИ =====
    if(hints){
      // Показываем правильный ответ как подсказку
      const correctBtn = Array.from(document.querySelectorAll('.option'))
        .find(o => o.textContent===formatSide(correct, testState.opts.optionSide));
      if(correctBtn) correctBtn.classList.add('hint');  // Подсвечиваем правильный ответ
      
      // При повторном неправильном клике - снимаем жизнь
      btn.onclick = ()=>{ 
        btn.classList.add('wrong'); 
        if(isFinite(testState.lives)) testState.lives--;  // Снимаем жизнь
        if(testState.lives<=0){ 
          endTest(false);  // Завершаем тест при исчерпании жизней
          return;
        } 
        // Отключаем все кнопки и переходим к следующему вопросу
        document.querySelectorAll('.option').forEach(o=>o.classList.add('disabled')); 
        setTimeout(()=> nextQuestion(), 200); 
        updateMeta(); 
      };
      
    // ===== РЕЖИМ БЕЗ ПОДСКАЗОК =====
    } else {
      // Снимаем жизнь сразу
      if(isFinite(testState.lives)) testState.lives--;
      if(testState.lives<=0){ 
        endTest(false);  // Завершаем тест при исчерпании жизней
        return; 
      }
      
      // При следующем клике переходим к следующему вопросу
      btn.onclick = ()=> { 
        document.querySelectorAll('.option').forEach(o=>o.classList.add('disabled')); 
        setTimeout(()=> nextQuestion(), 200); 
      };
      updateMeta();
    }
  }
}

// ===== ФУНКЦИЯ ПЕРЕХОДА К СЛЕДУЮЩЕМУ ВОПРОСУ =====
function nextQuestion(){
  testState.index++;  // Переходим к следующему вопросу
  
  // Если вопросы закончились - завершаем тест успешно
  if(testState.index >= testState.pool.length){ 
    endTest(true); 
    return; 
  }
  
  renderQuestion();  // Отображаем следующий вопрос
}

// ===== ФУНКЦИЯ ЗАВЕРШЕНИЯ ТЕСТА =====
function endTest(win){
  // Останавливаем таймер
  if(testTimer) clearInterval(testTimer);
  
  // Подсчитываем статистику
  const total = testState.pool.length;                           // Общее количество вопросов
  const correct = testState.correct;                             // Количество правильных ответов
  const elapsed = Math.floor((Date.now() - testState.startTS)/1000);  // Затраченное время в секундах
  
  // Показываем модальное окно с результатами
  const message = win 
    ? `Поздравляем, тест пройден!<br>Карточек отвечено: ${correct}/${total}<br>Секунд затрачено: ${elapsed}`
    : `Тест не пройден!<br>Карточек отвечено: ${correct}/${total}<br>Секунд затрачено: ${elapsed}`;
  
  const actions = [
    {text:'Заново', cb:()=>{ startTest(testState.opts); }},  // Кнопка повторного прохождения
    {text:'Меню', cb:()=>{ showScreen('menu'); el('test-area').classList.add('hidden'); }}  // Кнопка возврата в меню
  ];
  
  showModal(message, actions);
}

// ===== ГЕНЕРАТОР УМНЫХ ВАРИАНТОВ ОТВЕТОВ =====

// ===== НОРМАЛИЗАЦИЯ ПИНЬИНЬ =====
function normalizePinyin(s){
  if(!s) return '';
  
  // Заменяем диакритические знаки на обычные буквы
  let out = '';
  for(const ch of s){
    if(DIACRITIC_MAP[ch]) out += DIACRITIC_MAP[ch];
    else out += ch;
  }
  
  // Приводим к нижнему регистру и убираем пробелы и апострофы
  return out.toLowerCase().replace(/[\s''`]+/g,'');
}

// ===== ФУНКЦИЯ ИЗВЛЕЧЕНИЯ ПЕРВОГО СЛОГА =====
// Для сопоставления по первому слогу (например, "dadianhua" -> "da")
function pinyinFirstSyllable(s){
  const norm = normalizePinyin(s);
  // Простой алгоритм: берем символы до первой группы гласных включительно
  const m = norm.match(/^[^aeiouü]*[aeiouü]+/i);
  return m ? m[0] : norm;
}

// ===== ФУНКЦИЯ ПОДСЧЕТА ОБЩИХ ИЕРОГЛИФОВ =====
// Считает количество общих символов между двумя строками (исключая пробелы)
function sharedHanziCount(a,b){
  if(!a || !b) return 0;
  
  // Создаем множества символов без пробелов
  const sa = new Set(a.replace(/\s+/g,'').split(''));
  const sb = new Set(b.replace(/\s+/g,'').split(''));
  let cnt = 0;
  
  // Подсчитываем общие символы
  sa.forEach(ch => { if(sb.has(ch)) cnt++; });
  return cnt;
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С РУССКИМИ ТОКЕНАМИ =====
// Разбивает русский текст на токены (слова)
function rusTokens(s){
  if(!s) return [];
  // Разделяем по не-буквенным символам и фильтруем пустые строки
  return s.toLowerCase().split(/[^а-яёa-z0-9]+/i).filter(Boolean);
}

// Подсчитывает пересечение токенов между двумя строками
function tokenOverlap(a,b){
  const A = new Set(rusTokens(a));  // Множество токенов первой строки
  const B = new Set(rusTokens(b));  // Множество токенов второй строки
  let cnt = 0;
  
  // Подсчитываем общие токены
  A.forEach(t=>{ if(B.has(t)) cnt++; });
  return cnt;
}


  // cur: word object
// ===== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ УМНЫХ ВАРИАНТОВ =====
// Создает 4 варианта ответа (включая правильный) на основе семантического сходства
// cur - правильный ответ, side - тип вопроса ('hanzi'|'pinyin'|'russian')
function makeSmartOptions(cur, side){
  const pool = HSK1_WORDS.slice();                    // Копия всего словаря
  const candidates = pool.filter(p => p.id !== cur.id); // Исключаем правильный ответ
  let picked = [];                                     // Массив выбранных неправильных вариантов

  // ===== ОБРАБОТКА ВОПРОСОВ ПО ПИНЬИНЬ =====
  if(side === 'pinyin'){
    const normCur = normalizePinyin(cur.pinyin);
    
    // 1) Приоритет: слова с тем же нормализованным пиньинь, но разными тонами
    //    Например: "mā" vs "má" vs "mǎ" vs "mà" (все нормализуются в "ma")
    const sameBase = candidates.filter(c => normalizePinyin(c.pinyin) === normCur && c.pinyin !== cur.pinyin);
    shuffle(sameBase);
    picked = picked.concat(sameBase.slice(0,3));
    
    // 2) Если недостаточно: слова с тем же первым слогом, но разным полным пиньинь
    //    Например: "dà" и "dǎdiànhuà" (оба начинаются с "da")
    if(picked.length < 3){
      const first = pinyinFirstSyllable(cur.pinyin);
      const sameFirst = candidates.filter(c => pinyinFirstSyllable(c.pinyin) === first && normalizePinyin(c.pinyin) !== normCur && !picked.includes(c));
      shuffle(sameFirst);
      picked = picked.concat(sameFirst.slice(0, 3 - picked.length));
    }
    
    // 3) Запасной вариант: случайные слова
    if(picked.length < 3){
      const remain = shuffle(candidates.filter(c=> !picked.includes(c)));
      picked = picked.concat(remain.slice(0, 3 - picked.length));
    }
  // ===== ОБРАБОТКА ВОПРОСОВ ПО ИЕРОГЛИФАМ =====
  } else if(side === 'hanzi'){
    // 1) Приоритет: слова с общими иероглифами (визуальное сходство)
    //    Например: "大" и "大学" имеют общий иероглиф "大"
    const withShared = candidates
      .map(c => ({c, shared: sharedHanziCount(cur.hanzi, c.hanzi)}))
      .filter(x => x.shared > 0)
      .sort((a,b)=> b.shared - a.shared)  // Сортируем по количеству общих символов
      .map(x => x.c);
    shuffle(withShared);
    picked = picked.concat(withShared.slice(0,3));
    
    // 2) Если недостаточно: слова той же длины (схожая сложность)
    if(picked.length < 3){
      const sameLen = shuffle(candidates.filter(c=> c.hanzi.length === cur.hanzi.length && !picked.includes(c)));
      picked = picked.concat(sameLen.slice(0, 3 - picked.length));
    }
    
    // 3) Запасной вариант: случайные слова
    if(picked.length < 3){
      const remain = shuffle(candidates.filter(c=> !picked.includes(c)));
      picked = picked.concat(remain.slice(0, 3 - picked.length));
    }
  // ===== ОБРАБОТКА ВОПРОСОВ ПО РУССКОМУ ПЕРЕВОДУ =====
  } else { // russian
    // 1) Приоритет: слова с общими русскими токенами (семантическое сходство)
    //    Например: "большой дом" и "большая машина" имеют общий токен "большой"
    const withOverlap = candidates
      .map(c => ({c, overlap: tokenOverlap(cur.russian, c.russian)}))
      .filter(x => x.overlap > 0)
      .sort((a,b)=> b.overlap - a.overlap)  // Сортируем по количеству общих токенов
      .map(x => x.c);
    shuffle(withOverlap);
    picked = picked.concat(withOverlap.slice(0,3));
    
    // 2) Если недостаточно: слова с общими иероглифами (визуальная путаница)
    if(picked.length < 3){
      const byHanzi = shuffle(candidates.filter(c=> sharedHanziCount(cur.hanzi, c.hanzi) > 0 && !picked.includes(c)));
      picked = picked.concat(byHanzi.slice(0, 3 - picked.length));
    }
    
    // 3) Запасной вариант: случайные слова
    if(picked.length < 3){
      const remain = shuffle(candidates.filter(c=> !picked.includes(c)));
      picked = picked.concat(remain.slice(0, 3 - picked.length));
    }
  }

  // ===== ФИНАЛЬНАЯ ОБРАБОТКА И ФОРМИРОВАНИЕ РЕЗУЛЬТАТА =====
  // Обеспечиваем уникальность вариантов и включаем правильный ответ
  const unique = [];
  const ids = new Set();
  
  // Добавляем правильный ответ
  unique.push(cur); 
  ids.add(cur.id);
  
  // Добавляем выбранные неправильные варианты (без дубликатов)
  for(const p of picked){
    if(!ids.has(p.id)){
      unique.push(p); 
      ids.add(p.id);
    }
    if(unique.length >= 4) break;  // Нужно всего 4 варианта
  }
  
  // Финальная проверка: если меньше 4 вариантов, добавляем случайные
  if(unique.length < 4){
    const others = shuffle(HSK1_WORDS.filter(w=> !ids.has(w.id)));
    while(unique.length < 4 && others.length) unique.push(others.shift());
  }

  
  return shuffle(unique); // Перемешиваем порядок вариантов
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

// 


// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP =====
// Инициализация Telegram Mini App если доступно
function initializeTelegramWebApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Расширяем приложение на весь экран
    tg.expand();
    
    // Настраиваем цвет заголовка
    tg.setHeaderColor('#2196F3');
    
    // Настраиваем главную кнопку
    tg.MainButton.setText('Закрыть');
    tg.MainButton.color = '#2196F3';
    tg.MainButton.textColor = '#FFFFFF';
    
    // Обработчик главной кнопки
    tg.MainButton.onClick(() => {
      tg.close();
    });
    
    // Показываем кнопку только когда нужно
    // tg.MainButton.show();
    
    console.log('Telegram Web App initialized');
  }
}

// init
// App initialization with access control
async function initializeApp() {
  if (appInitialized) return;
  
  dbg('Starting app initialization...');
  
  // Инициализируем Telegram Web App
  initializeTelegramWebApp();
  
  try {
    // Initialize Telegram Web App
    await window.telegramApp.init();
    dbg('Telegram Web App initialized');
    
    // Check subscription access
    const hasAccess = await window.subscriptionCheck.checkAccess();
    
    if (hasAccess) {
      accessGranted = true;
      enableAppFeatures();
    } else {
      dbg('Access denied - subscription check required');
      disableAppFeatures();
    }
    
  } catch (error) {
    console.error('App initialization failed:', error);
    // In case of error, allow access for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      dbg('Development mode - allowing access');
      accessGranted = true;
      enableAppFeatures();
    } else {
      showModal('Ошибка инициализации приложения. Попробуйте перезагрузить страницу.');
    }
  }
  
  appInitialized = true;
}

// Enable app features after access is granted
function enableAppFeatures() {
  dbg('Access granted - enabling app features');
  
  // Show main menu
  showScreen('menu');
  
  // Enable all buttons
  btnDict.disabled = false;
  btnCards.disabled = false;
  btnTest.disabled = false;
  
  // Render dictionary
  renderDict();
  
  dbg('App fully initialized', {knownCount: known.size});
}

// Disable app features when access is denied
function disableAppFeatures() {
  dbg('Access denied - disabling app features');
  
  // Disable all buttons
  btnDict.disabled = true;
  btnCards.disabled = true;
  btnTest.disabled = true;
  
  // Hide all screens
  hideAll();
}

// Handle subscription access granted event
window.addEventListener('subscriptionAccessGranted', (event) => {
  dbg('Subscription access granted event received', event.detail);
  accessGranted = true;
  enableAppFeatures();
});

// Override button click handlers to check access
const originalBtnDict = btnDict.cloneNode(true);
const originalBtnCards = btnCards.cloneNode(true);
const originalBtnTest = btnTest.cloneNode(true);

btnDict.addEventListener('click', (e) => {
  if (!accessGranted) {
    e.preventDefault();
    window.subscriptionCheck.show();
    return;
  }
  showScreen('dict');
});

btnCards.addEventListener('click', (e) => {
  if (!accessGranted) {
    e.preventDefault();
    window.subscriptionCheck.show();
    return;
  }
  if (known.size < 10) {
    showModal('Для доступа к карточкам нужно отметить минимум 10 слов в словаре.');
    return;
  }
  showScreen('cards');
});

btnTest.addEventListener('click', (e) => {
  if (!accessGranted) {
    e.preventDefault();
    window.subscriptionCheck.show();
    return;
  }
  if (known.size < 10) {
    showModal('Для доступа к тесту нужно отметить минимум 10 слов в словаре.');
    return;
  }
  showScreen('test');
});

// Start app initialization
initializeApp();
