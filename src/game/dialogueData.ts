import { DialogueNode, NPC } from './types';

export const dialogues: Record<string, DialogueNode> = {
  // Old lady near the market
  'oldlady_start': {
    id: 'oldlady_start',
    speaker: 'Бабуся Роза',
    text: 'О, дитинко! Що ти робиш одна в такий пізній час? Місто може бути небезпечним...',
    responses: [
      { text: 'Я шукаю свою подружку Міку! Ви її не бачили?', nextId: 'oldlady_miku' },
      { text: 'Я не одна, у мене є Куромі! *показує капюшон*', nextId: 'oldlady_kuromi' },
    ],
  },
  'oldlady_miku': {
    id: 'oldlady_miku',
    speaker: 'Бабуся Роза',
    text: 'Міку? Маленька дівчинка з рожевим бантиком? Здається, я бачила її біля парку в каналі, години дві тому. Вона йшла в бік червоної будівлі.',
    questUpdate: 'Бабуся Роза бачила Міку біля парку 2 години тому. Перевірити червону будівлю.',
    responses: [
      { text: 'Дякую, бабусю! Я побіжу туди!', nextId: 'oldlady_end' },
    ],
  },
  'oldlady_kuromi': {
    id: 'oldlady_kuromi',
    speaker: 'Бабуся Роза',
    text: 'Ха-ха, який гарний капюшон! Але все одно будь обережна. До речі, ти щось шукаєш?',
    responses: [
      { text: 'Так! Я шукаю подружку Міку!', nextId: 'oldlady_miku' },
    ],
  },
  'oldlady_end': {
    id: 'oldlady_end',
    speaker: 'Бабуся Роза',
    text: 'Удачі, дитинко! І не розмовляй з незнайомцями... ну, окрім мене, звичайно! 😄',
  },

  // Street musician
  'musician_start': {
    id: 'musician_start',
    speaker: 'Вуличний музикант Лео',
    text: '*перебирає струни гітари* Гей, маленька Куромі! Подобається музика? 🎵',
    responses: [
      { text: 'Гарно граєте! Ви не бачили мою подружку Міку?', nextId: 'musician_miku' },
      { text: 'Я не маленька! Мені вже вісім!', nextId: 'musician_age' },
    ],
  },
  'musician_miku': {
    id: 'musician_miku',
    speaker: 'Вуличний музикант Лео',
    text: 'Міку... з рожевим бантиком? Вона проходила повз, кинула мені монетку і побігла до мосту через канал. Виглядала так, ніби за кимось ганялась.',
    questUpdate: 'Музикант Лео бачив Міку, що бігла до мосту. Вона за кимось ганялась!',
    responses: [
      { text: 'До мосту? Дякую! Треба поспішити!', nextId: 'musician_end' },
    ],
  },
  'musician_age': {
    id: 'musician_age',
    speaker: 'Вуличний музикант Лео',
    text: 'О, вибачте, леді! Вісім — це вже серйозний вік. Можу чимось допомогти?',
    responses: [
      { text: 'Так, я шукаю подружку Міку!', nextId: 'musician_miku' },
    ],
  },
  'musician_end': {
    id: 'musician_end',
    speaker: 'Вуличний музикант Лео',
    text: '*грає тривожну мелодію* Будь обережна на мосту, маленька героїне! 🎶',
  },

  // Shopkeeper
  'shop_start': {
    id: 'shop_start',
    speaker: 'Продавець Ханс',
    text: 'Ласкаво просимо до мого магазину! У нас сьогодні знижка на... зачекай, ти ж дитина. Що тобі потрібно?',
    responses: [
      { text: 'Ви бачили дівчинку з рожевим бантиком? Це моя подруга Міку!', nextId: 'shop_miku' },
      { text: '🛒 Хочу подивитись товари!', nextId: 'shop_open' },
      { text: 'А що у вас є цікавого?', nextId: 'shop_items' },
    ],
  },
  'shop_open': {
    id: 'shop_open',
    speaker: 'Продавець Ханс',
    text: 'OPEN_SHOP:all',
  },
  'shop_miku': {
    id: 'shop_miku',
    speaker: 'Продавець Ханс',
    text: 'Так-так, вона заходила! Купила ліхтарик і карту підземель... Підземель?! Я думав це для шкільного проєкту, але...',
    questUpdate: 'Міку купила ліхтарик і карту підземель в магазині Ханса. Куди вона зібралась?!',
    responses: [
      { text: 'Карту підземель?! А де ці підземелля?', nextId: 'shop_dungeons' },
      { text: '🛒 Хочу подивитись товари!', nextId: 'shop_open' },
    ],
  },
  'shop_items': {
    id: 'shop_items',
    speaker: 'Продавець Ханс',
    text: 'Для такої стильної леді в капюшоні Куромі... може, ліхтарик? Дуже корисна річ вночі!',
    responses: [
      { text: 'Ні, дякую. Я шукаю свою подружку!', nextId: 'shop_miku' },
      { text: '🛒 Покажіть усе!', nextId: 'shop_open' },
    ],
  },
  'shop_dungeons': {
    id: 'shop_dungeons',
    speaker: 'Продавець Ханс',
    text: 'Під старою червоною будівлею біля каналу є вхід. Але туди НЕ МОЖНА ходити дітям! Хоча... твоя подруга, здається, не знала цього правила.',
    questUpdate: 'Під червоною будівлею біля каналу є вхід в підземелля. Міку могла піти туди!',
    responses: [
      { text: '🛒 Тоді мені знадобиться спорядження!', nextId: 'shop_open' },
    ],
  },

  // Medicine shop (Аптека)
  'medicine_start': {
    id: 'medicine_start',
    speaker: 'Аптекарка Оля',
    text: 'Ласкаво просимо до аптеки «Здоров\'я»! У нас є все для відновлення сил. Що тобі потрібно?',
    responses: [
      { text: '💊 Покажіть ліки та зілля!', nextId: 'medicine_open' },
      { text: 'Ви не бачили дівчинку з рожевим бантиком?', nextId: 'medicine_miku' },
    ],
  },
  'medicine_open': {
    id: 'medicine_open',
    speaker: 'Аптекарка Оля',
    text: 'OPEN_SHOP:healing',
  },
  'medicine_miku': {
    id: 'medicine_miku',
    speaker: 'Аптекарка Оля',
    text: 'З бантиком? Так, вона купила пакетик мармеладних ведмедиків і побігла кудись. Виглядала схвильованою!',
    responses: [
      { text: '💊 Тоді мені теж знадобляться ліки!', nextId: 'medicine_open' },
      { text: 'Дякую!', nextId: 'medicine_end' },
    ],
  },
  'medicine_end': {
    id: 'medicine_end',
    speaker: 'Аптекарка Оля',
    text: 'Бережи себе, дитинко! І не забувай їсти вітаміни! 🍎',
  },

  // Police shop (Поліція)
  'police_start': {
    id: 'police_start',
    speaker: 'Офіцер Макс',
    text: 'Стій! Хто тут? А, дівчинка в капюшоні Куромі... Що тобі потрібно? У нас тут поліцейський арсенал.',
    responses: [
      { text: '🛡️ Покажіть бойове спорядження!', nextId: 'police_open' },
      { text: 'Я шукаю свою подругу. Тут небезпечно?', nextId: 'police_danger' },
    ],
  },
  'police_open': {
    id: 'police_open',
    speaker: 'Офіцер Макс',
    text: 'OPEN_SHOP:combat',
  },
  'police_danger': {
    id: 'police_danger',
    speaker: 'Офіцер Макс',
    text: 'Небезпечно?! В підземеллях повно монстрів! Раджу озброїтися перед тим, як туди йти. У мене є все для захисту!',
    responses: [
      { text: '🛡️ Тоді покажіть зброю!', nextId: 'police_open' },
      { text: 'Дякую за попередження!', nextId: 'police_end' },
    ],
  },
  'police_end': {
    id: 'police_end',
    speaker: 'Офіцер Макс',
    text: 'Будь обережна! І якщо побачиш монстрів — біжи або бийся, але не стій на місці! 💪',
  },

  // Museum shop (Музей)
  'museum_start': {
    id: 'museum_start',
    speaker: 'Куратор Софія',
    text: 'О, гостя! Ласкаво просимо до Музею дивовижних речей! У нас зібрані найнезвичайніші предмети з усього світу!',
    responses: [
      { text: '✨ Покажіть незвичайні речі!', nextId: 'museum_open' },
      { text: 'Тут є щось для подорожей підземеллями?', nextId: 'museum_dungeon' },
    ],
  },
  'museum_open': {
    id: 'museum_open',
    speaker: 'Куратор Софія',
    text: 'OPEN_SHOP:unusual',
  },
  'museum_dungeon': {
    id: 'museum_dungeon',
    speaker: 'Куратор Софія',
    text: 'О так! Водні кросівки дозволять ходити по воді, а компас покаже шлях! Є ще багато цікавого...',
    responses: [
      { text: '✨ Хочу подивитись усе!', nextId: 'museum_open' },
      { text: 'Круто, дякую!', nextId: 'museum_end' },
    ],
  },
  'museum_end': {
    id: 'museum_end',
    speaker: 'Куратор Софія',
    text: 'Заходь ще! Кожен предмет тут має свою чарівну історію! ✨',
  },

  // Mika dialogue
  'mika_start': {
    id: 'mika_start',
    speaker: 'Міка',
    text: 'Куромі?! Це ти?! 😭 Я так злякалась! Я загубилась в цьому лабіринті і не могла знайти вихід!',
    responses: [
      { text: 'Міку! Я так за тобою шукала! Ти в порядку?', nextId: 'mika_safe' },
    ],
  },
  'mika_safe': {
    id: 'mika_safe',
    speaker: 'Міка',
    text: 'Так, я в порядку! Але... я загубила свій улюблений бантик десь у синьому підземеллі! 🎀 Ти його знайшла?',
    responses: [
      { text: 'Так, я знайшла твій бантик! Ось він! 🎀', nextId: 'mika_bow_yes', condition: 'has_bow' },
      { text: 'Ні, я ще не знайшла... Де він може бути?', nextId: 'mika_bow_no' },
    ],
  },
  'mika_bow_yes': {
    id: 'mika_bow_yes',
    speaker: 'Міка',
    text: '🎀 Мій бантик! Дякую, дякую, дякую! Ти найкраща подруга на світі! 💖 Ходімо додому разом!',
    responses: [
      { text: 'Ходімо! Більше не тікай одна! 💕', nextId: 'mika_end' },
    ],
  },
  'mika_bow_no': {
    id: 'mika_bow_no',
    speaker: 'Міка',
    text: 'Я загубила його в синьому підземеллі... Воно знаходиться під червоним будинком біля бабусі Рози. Бантик десь у центрі лабіринту! Будь ласка, знайди його! 🥺',
    questUpdate: 'Міка просить знайти її бантик у синьому підземеллі — він у центрі лабіринту!',
    responses: [
      { text: 'Я обов\'язково знайду його! Чекай тут!', nextId: 'mika_bow_no_end' },
    ],
  },
  'mika_bow_no_end': {
    id: 'mika_bow_no_end',
    speaker: 'Міка',
    text: 'Дякую! Я буду чекати тут! Будь обережна! 💕',
  },
  'mika_end': {
    id: 'mika_end',
    speaker: 'Міка',
    text: '🎉 Так! Ходімо! Я більше ніколи не піду в підземелля одна! Дякую, що знайшла мене і мій бантик! 💖🎀',
    questUpdate: 'ПЕРЕМОГА',
  },
};

export const npcs: NPC[] = [
  {
    id: 'oldlady',
    name: 'Бабуся Роза',
    pos: { x: 8, y: 6 },
    dialogueId: 'oldlady_start',
    icon: '👵',
    hasInteracted: false,
    description: 'Добра бабуся з кошиком',
  },
  {
    id: 'musician',
    name: 'Музикант Лео',
    pos: { x: 20, y: 15 },
    dialogueId: 'musician_start',
    icon: '🎸',
    hasInteracted: false,
    description: 'Вуличний музикант з гітарою',
  },
  {
    id: 'shopkeeper',
    name: 'Продавець Ханс',
    pos: { x: 32, y: 8 },
    dialogueId: 'shop_start',
    icon: '🏪',
    hasInteracted: false,
    description: 'Власник магазинчику',
  },
  {
    id: 'medicine',
    name: 'Аптекарка Оля',
    pos: { x: 5, y: 26 },
    dialogueId: 'medicine_start',
    icon: '🏥',
    hasInteracted: false,
    description: 'Продає ліки та зілля',
  },
  {
    id: 'police',
    name: 'Офіцер Макс',
    pos: { x: 19, y: 26 },
    dialogueId: 'police_start',
    icon: '🛡️',
    hasInteracted: false,
    description: 'Поліцейський арсенал',
  },
  {
    id: 'museum',
    name: 'Куратор Софія',
    pos: { x: 33, y: 26 },
    dialogueId: 'museum_start',
    icon: '🏛️',
    hasInteracted: false,
    description: 'Музей дивовижних речей',
  },
];
