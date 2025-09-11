/**
 * ===== СЛОВАРЬ HSK-1 ДЛЯ ПРИЛОЖЕНИЯ HSK-ТРЕНЕР =====
 * 
 * Этот файл содержит полный словарь слов уровня HSK-1 (150 слов)
 * для изучения китайского языка в приложении HSK-тренер.
 * 
 * СТРУКТУРА КАЖДОГО СЛОВА:
 * - id: уникальный идентификатор слова (число)
 * - hanzi: китайские иероглифы (строка)
 * - pinyin: транскрипция пиньинь с тонами (строка)
 * - russian: перевод на русский язык (строка)
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * Этот массив используется в app.js для:
 * - Генерации случайных вопросов в тестах
 * - Создания умных вариантов ответов
 * - Отображения карточек со словами
 * - Поиска и фильтрации слов
 * 
 * ВАЖНО: Порядок слов соответствует официальному списку HSK-1
 */

// Экспортируем массив всех слов HSK-1 уровня
export const HSK1_WORDS = [
  { id: 1,   hanzi: "爱",        pinyin: "ài",         russian: "любить, нравиться" },
  { id: 2,   hanzi: "八",        pinyin: "bā",         russian: "восемь" },
  { id: 3,   hanzi: "爸爸",      pinyin: "bàba",       russian: "папа, отец" },
  { id: 4,   hanzi: "杯子",      pinyin: "bēizi",      russian: "стакан, кружка" },
  { id: 5,   hanzi: "北京",      pinyin: "Běijīng",    russian: "Пекин" },
  { id: 6,   hanzi: "本",        pinyin: "běn",        russian: "счётное слово для книг" },
  { id: 7,   hanzi: "不客气",    pinyin: "bù kèqi",    russian: "не стоит благодарности!" },
  { id: 8,   hanzi: "不",        pinyin: "bù",         russian: "не, нет" },
  { id: 9,   hanzi: "菜",        pinyin: "cài",        russian: "овощи, блюдо" },
  { id: 10,  hanzi: "茶",        pinyin: "chá",        russian: "чай" },
  { id: 11,  hanzi: "吃",        pinyin: "chī",        russian: "есть" },
  { id: 12,  hanzi: "出租车",    pinyin: "chūzūchē",   russian: "такси" },
  { id: 13,  hanzi: "打电话",    pinyin: "dǎ diànhuà", russian: "звонить по телефону" },
  { id: 14,  hanzi: "大",        pinyin: "dà",         russian: "большой" },
  { id: 15,  hanzi: "的",        pinyin: "de",         russian: "служебное слово (притяжательное, указательное и т.д.)" },
  { id: 16,  hanzi: "点",        pinyin: "diǎn",       russian: "час (единица времени)" },
  { id: 17,  hanzi: "电脑",      pinyin: "diànnǎo",    russian: "компьютер" },
  { id: 18,  hanzi: "电视",      pinyin: "diànshì",    russian: "телевизор" },
  { id: 19,  hanzi: "电影",      pinyin: "diànyǐng",   russian: "кино, фильм" },
  { id: 20,  hanzi: "东西",      pinyin: "dōngxi",     russian: "вещь, предмет" },
  { id: 21,  hanzi: "都",        pinyin: "dōu",        russian: "всё, все" },
  { id: 22,  hanzi: "读",        pinyin: "dú",         russian: "читать" },
  { id: 23,  hanzi: "对不起",    pinyin: "duìbuqǐ",    russian: "извините, простите" },
  { id: 24,  hanzi: "多",        pinyin: "duō",        russian: "много, насколько" },
  { id: 25,  hanzi: "多少",      pinyin: "duōshao",    russian: "сколько" },
  { id: 26,  hanzi: "儿子",      pinyin: "érzi",       russian: "сын" },
  { id: 27,  hanzi: "二",        pinyin: "èr",         russian: "два" },
  { id: 28,  hanzi: "饭店",      pinyin: "fàndiàn",    russian: "ресторан" },
  { id: 29,  hanzi: "飞机",      pinyin: "fēijī",      russian: "самолёт" },
  { id: 30,  hanzi: "分钟",      pinyin: "fēnzhōng",   russian: "минута" },
  { id: 31,  hanzi: "高兴",      pinyin: "gāoxìng",    russian: "радостный, рад" },
  { id: 32,  hanzi: "个",        pinyin: "gè",         russian: "универсальное счётное слово" },
  { id: 33,  hanzi: "工作",      pinyin: "gōngzuò",    russian: "работать / работа" },
  { id: 34,  hanzi: "狗",        pinyin: "gǒu",        russian: "собака" },
  { id: 35,  hanzi: "汉语",      pinyin: "Hànyǔ",      russian: "китайский язык" },
  { id: 36,  hanzi: "好",        pinyin: "hǎo",        russian: "хороший, хорошо" },
  { id: 37,  hanzi: "号",        pinyin: "hào",        russian: "число (дата)" },
  { id: 38,  hanzi: "喝",        pinyin: "hē",         russian: "пить" },
  { id: 39,  hanzi: "和",        pinyin: "hé",         russian: "и, с" },
  { id: 40,  hanzi: "很",        pinyin: "hěn",        russian: "очень" },
  { id: 41,  hanzi: "后面",      pinyin: "hòumiàn",    russian: "позади, сзади" },
  { id: 42,  hanzi: "回",        pinyin: "huí",        russian: "возвращаться" },
  { id: 43,  hanzi: "会",        pinyin: "huì",        russian: "мочь, уметь" },
  { id: 44,  hanzi: "几",        pinyin: "jǐ",         russian: "сколько (2–9), несколько" },
  { id: 45,  hanzi: "家",        pinyin: "jiā",        russian: "семья, дом" },
  { id: 46,  hanzi: "叫",        pinyin: "jiào",       russian: "звать, называться" },
  { id: 47,  hanzi: "今天",      pinyin: "jīntiān",    russian: "сегодня" },
  { id: 48,  hanzi: "九",        pinyin: "jiǔ",        russian: "девять" },
  { id: 49,  hanzi: "开",        pinyin: "kāi",        russian: "открывать, включать" },
  { id: 50,  hanzi: "看",        pinyin: "kàn",        russian: "смотреть, читать" },
  { id: 51,  hanzi: "看见",      pinyin: "kànjiàn",    russian: "увидеть" },
  { id: 52,  hanzi: "块",        pinyin: "kuài",       russian: "кусок (счётное слово)" },
  { id: 53,  hanzi: "来",        pinyin: "lái",        russian: "приходить" },
  { id: 54,  hanzi: "老师",      pinyin: "lǎoshī",     russian: "учитель" },
  { id: 55,  hanzi: "了",        pinyin: "le",         russian: "служебное слово (указывает на завершённость действия)" },
  { id: 56,  hanzi: "冷",        pinyin: "lěng",       russian: "холодный" },
  { id: 57,  hanzi: "里",        pinyin: "lǐ",         russian: "внутри, в" },
  { id: 58,  hanzi: "六",        pinyin: "liù",        russian: "шесть" },
  { id: 59,  hanzi: "妈妈",      pinyin: "māma",       russian: "мама, мать" },
  { id: 60,  hanzi: "吗",        pinyin: "ma",         russian: "вопросительная частица" },
  { id: 61,  hanzi: "买",        pinyin: "mǎi",        russian: "покупать" },
  { id: 62,  hanzi: "猫",        pinyin: "māo",        russian: "кот" },
  { id: 63,  hanzi: "没关系",    pinyin: "méi guānxi",  russian: "неважно, пустяки" },
  { id: 64,  hanzi: "没有",      pinyin: "méiyǒu",     russian: "нет, не имеет" },
  { id: 65,  hanzi: "米饭",      pinyin: "mǐfàn",      russian: "рис" },
  { id: 66,  hanzi: "名字",      pinyin: "míngzi",     russian: "имя" },
  { id: 67,  hanzi: "明天",      pinyin: "míngtiān",   russian: "завтра" },
  { id: 68,  hanzi: "哪",        pinyin: "nǎ",         russian: "который, какой" },
  { id: 69,  hanzi: "哪儿",      pinyin: "nǎr",        russian: "где, куда" },
  { id: 70,  hanzi: "那",        pinyin: "nà",         russian: "тот, та, то" },
  { id: 71,  hanzi: "呢",        pinyin: "ne",         russian: "частица (уточнение, продолжение действия)" },
  { id: 72,  hanzi: "能",        pinyin: "néng",       russian: "мочь, быть способным" },
  { id: 73,  hanzi: "你",        pinyin: "nǐ",         russian: "ты" },
  { id: 74,  hanzi: "年",        pinyin: "nián",       russian: "год (единица времени)" },
  { id: 75,  hanzi: "女儿",      pinyin: "nǚ'ér",      russian: "дочь" },
  { id: 76,  hanzi: "朋友",      pinyin: "péngyou",    russian: "друг" },
  { id: 77,  hanzi: "漂亮",      pinyin: "piàoliang",  russian: "красивый" },
  { id: 78,  hanzi: "苹果",      pinyin: "píngguǒ",    russian: "яблоко" },
  { id: 79,  hanzi: "七",        pinyin: "qī",         russian: "семь" },
  { id: 80,  hanzi: "前面",      pinyin: "qiánmiàn",   russian: "впереди, перед" },
  { id: 81,  hanzi: "钱",        pinyin: "qián",       russian: "деньги" },
  { id: 82,  hanzi: "请",        pinyin: "qǐng",       russian: "просить (вежливо)" },
  { id: 83,  hanzi: "去",        pinyin: "qù",         russian: "идти, ехать" },
  { id: 84,  hanzi: "热",        pinyin: "rè",         russian: "горячий, жаркий" },
  { id: 85,  hanzi: "人",        pinyin: "rén",        russian: "человек, люди" },
  { id: 86,  hanzi: "认识",      pinyin: "rènshi",     russian: "знать, быть знакомым" },
  { id: 87,  hanzi: "三",        pinyin: "sān",        russian: "три" },
  { id: 88,  hanzi: "商店",      pinyin: "shāngdiàn",  russian: "магазин" },
  { id: 89,  hanzi: "上",        pinyin: "shàng",      russian: "верх, на (верху)" },
  { id: 90,  hanzi: "上午",      pinyin: "shàngwǔ",    russian: "утро, первая половина дня" },
  { id: 91,  hanzi: "少",        pinyin: "shǎo",       russian: "мало" },
  { id: 92,  hanzi: "谁",        pinyin: "shéi",       russian: "кто, чей" },
  { id: 93,  hanzi: "什么",      pinyin: "shénme",     russian: "что" },
  { id: 94,  hanzi: "十",        pinyin: "shí",        russian: "десять" },
  { id: 95,  hanzi: "时候",      pinyin: "shíhou",     russian: "время, момент" },
  { id: 96,  hanzi: "是",        pinyin: "shì",        russian: "быть, являться" },
  { id: 97,  hanzi: "书",        pinyin: "shū",        russian: "книга" },
  { id: 98,  hanzi: "水",        pinyin: "shuǐ",       russian: "вода" },
  { id: 99,  hanzi: "水果",      pinyin: "shuǐguǒ",    russian: "фрукт" },
  { id: 100, hanzi: "睡觉",      pinyin: "shuìjiào",   russian: "спать" },
  { id: 101, hanzi: "说",        pinyin: "shuō",       russian: "говорить" },
  { id: 102, hanzi: "四",        pinyin: "sì",         russian: "четыре" },
  { id: 103, hanzi: "岁",        pinyin: "suì",        russian: "годы, лет (возраст)" },
  { id: 104, hanzi: "他",        pinyin: "tā",         russian: "он, его" },
  { id: 105, hanzi: "她",        pinyin: "tā",         russian: "она, её" },
  { id: 106, hanzi: "太",        pinyin: "tài",        russian: "слишком, чрезмерно" },
  { id: 107, hanzi: "天气",      pinyin: "tiānqì",     russian: "погода" },
  { id: 108, hanzi: "听",        pinyin: "tīng",       russian: "слушать" },
  { id: 109, hanzi: "同学",      pinyin: "tóngxué",    russian: "одноклассник, ученик" },
  { id: 110, hanzi: "喂",        pinyin: "wèi",        russian: "алло, эй (при разговоре по телефону)" },
  { id: 111, hanzi: "我",        pinyin: "wǒ",         russian: "я" },
  { id: 112, hanzi: "我们",      pinyin: "wǒmen",      russian: "мы" },
  { id: 113, hanzi: "五",        pinyin: "wǔ",         russian: "пять" },
  { id: 114, hanzi: "喜欢",      pinyin: "xǐhuan",      russian: "нравиться" },
  { id: 115, hanzi: "下",        pinyin: "xià",        russian: "внизу, под" },
  { id: 116, hanzi: "下午",      pinyin: "xiàwǔ",      russian: "день, вторая половина дня" },
  { id: 117, hanzi: "下雨",      pinyin: "xià yǔ",     russian: "идёт дождь" },
  { id: 118, hanzi: "先生",      pinyin: "xiānsheng",  russian: "мистер, господин" },
  { id: 119, hanzi: "现在",      pinyin: "xiànzaì",    russian: "сейчас, в настоящее время" },
  { id: 120, hanzi: "想",        pinyin: "xiǎng",      russian: "хотеть, желать" },
  { id: 121, hanzi: "小",        pinyin: "xiǎo",       russian: "маленький" },
  { id: 122, hanzi: "小姐",      pinyin: "xiǎojiě",    russian: "мисс, девушка" },
  { id: 123, hanzi: "些",        pinyin: "xiē",        russian: "несколько, немного" },
  { id: 124, hanzi: "写",        pinyin: "xiě",        russian: "писать" },
  { id: 125, hanzi: "谢谢",      pinyin: "xièxie",     russian: "благодарить, говорить спасибо" },
  { id: 126, hanzi: "星期",      pinyin: "xīngqī",     russian: "неделя" },
  { id: 127, hanzi: "学生",      pinyin: "xuéshēng",   russian: "студент, ученик" },
  { id: 128, hanzi: "学习",      pinyin: "xuéxí",      russian: "учиться" },
  { id: 129, hanzi: "学校",      pinyin: "xuéxiào",    russian: "школа, учебное заведение" },
  { id: 130, hanzi: "一",        pinyin: "yī",         russian: "один" },
  { id: 131, hanzi: "衣服",      pinyin: "yīfu",       russian: "одежда" },
  { id: 132, hanzi: "医生",      pinyin: "yīshēng",    russian: "врач, доктор" },
  { id: 133, hanzi: "医院",      pinyin: "yīyuàn",     russian: "больница" },
  { id: 134, hanzi: "椅子",      pinyin: "yǐzi",       russian: "стул" },
  { id: 135, hanzi: "一点儿",    pinyin: "yìdiǎnr",    russian: "немного, чуть-чуть" },
  { id: 136, hanzi: "有",        pinyin: "yǒu",        russian: "иметь, обладать" },
  { id: 137, hanzi: "月",        pinyin: "yuè",        russian: "месяц" },
  { id: 138, hanzi: "再见",      pinyin: "zàijiàn",    russian: "до свидания, до встречи" },
  { id: 139, hanzi: "在",        pinyin: "zài",        russian: "быть, находиться" },
  { id: 140, hanzi: "怎么",      pinyin: "zěnme",      russian: "как" },
  { id: 141, hanzi: "怎么样",    pinyin: "zěnmeyàng",  russian: "как, каким образом" },
  { id: 142, hanzi: "这",        pinyin: "zhè",        russian: "это, этот" },
  { id: 143, hanzi: "中国",      pinyin: "Zhōngguó",   russian: "Китай" },
  { id: 144, hanzi: "中午",      pinyin: "zhōngwǔ",   russian: "полдень" },
  { id: 145, hanzi: "住",        pinyin: "zhù",        russian: "жить" },
  { id: 146, hanzi: "桌子",      pinyin: "zhuōzi",     russian: "стол" },
  { id: 147, hanzi: "字",        pinyin: "zì",         russian: "иероглиф" },
  { id: 148, hanzi: "昨天",      pinyin: "zuótiān",    russian: "вчера" },
  { id: 149, hanzi: "坐",        pinyin: "zuò",        russian: "сидеть, ехать (на транспорте)" },
  { id: 150, hanzi: "做",        pinyin: "zuò",        russian: "делать" }
];

/**
 * ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ О СЛОВАРЕ HSK-1:
 * 
 * Всего слов: 150
 * Уровень сложности: Начальный (HSK-1)
 * Покрытие: ~40% повседневной китайской речи
 * 
 * КАТЕГОРИИ СЛОВ В СЛОВАРЕ:
 * - Числа (一, 二, 三, 四, 五, 六, 七, 八, 九, 十)
 * - Местоимения (我, 你, 他, 她, 这, 那)
 * - Семья (爸爸, 妈妈, 儿子, 女儿)
 * - Время (今天, 明天, 昨天, 年, 月)
 * - Еда и напитки (茶, 水, 米饭, 苹果, 水果)
 * - Повседневные действия (吃, 喝, 看, 听, 说, 读, 写)
 * - Места (家, 学校, 医院, 商店, 北京, 中国)
 * - Транспорт (出租车, 飞机)
 * - Вежливые выражения (谢谢, 对不起, 不客气, 再见)
 * 
 * ПРИМЕЧАНИЯ:
 * - Все тоны в пиньинь указаны диакритическими знаками
 * - Переводы адаптированы для русскоязычных учащихся
 * - Порядок слов соответствует официальному списку HSK Institute
 */
