import { DialogueNode, NPC } from './types';

export const dialogues: Record<string, DialogueNode> = {
  // Old lady near the market
  'oldlady_start': {
    id: 'oldlady_start',
    speaker: 'Бабушка Роза',
    text: 'О, деточка! Что ты делаешь одна в такой поздний час? Город может быть опасным...',
    responses: [
      { text: 'Я ищу свою подружку Мику! Вы её не видели?', nextId: 'oldlady_miku' },
      { text: 'Я не одна, у меня есть Куроми! *показывает капюшон*', nextId: 'oldlady_kuromi' },
    ],
  },
  'oldlady_miku': {
    id: 'oldlady_miku',
    speaker: 'Бабушка Роза',
    text: 'Мику? Маленькая девочка с розовым бантиком? Кажется, я видела её около парка у канала, часа два назад. Она шла в сторону красного здания.',
    questUpdate: 'Бабушка Роза видела Мику у парка 2 часа назад. Проверить красное здание.',
    responses: [
      { text: 'Спасибо, бабушка! Я побегу туда!', nextId: 'oldlady_end' },
    ],
  },
  'oldlady_kuromi': {
    id: 'oldlady_kuromi',
    speaker: 'Бабушка Роза',
    text: 'Ха-ха, какой милый капюшон! Но всё-таки будь осторожна. Кстати, ты что-то ищешь?',
    responses: [
      { text: 'Да! Я ищу свою подружку Мику!', nextId: 'oldlady_miku' },
    ],
  },
  'oldlady_end': {
    id: 'oldlady_end',
    speaker: 'Бабушка Роза',
    text: 'Удачи, деточка! И не разговаривай с незнакомцами... ну, кроме меня, конечно! 😄',
  },

  // Street musician
  'musician_start': {
    id: 'musician_start',
    speaker: 'Уличный музыкант Лео',
    text: '*перебирает струны гитары* Эй, маленькая Куроми! Нравится музыка? 🎵',
    responses: [
      { text: 'Красиво играете! Вы не видели мою подружку Мику?', nextId: 'musician_miku' },
      { text: 'Я не маленькая! Мне уже восемь!', nextId: 'musician_age' },
    ],
  },
  'musician_miku': {
    id: 'musician_miku',
    speaker: 'Уличный музыкант Лео',
    text: 'Мику... с розовым бантиком? Она проходила мимо, бросила мне монетку и побежала к мосту через канал. Выглядела так, будто за кем-то гналась.',
    questUpdate: 'Музыкант Лео видел Мику бегущей к мосту. Она за кем-то гналась!',
    responses: [
      { text: 'К мосту? Спасибо! Надо спешить!', nextId: 'musician_end' },
    ],
  },
  'musician_age': {
    id: 'musician_age',
    speaker: 'Уличный музыкант Лео',
    text: 'О, простите, леди! Восемь — это уже серьёзный возраст. Могу чем-то помочь?',
    responses: [
      { text: 'Да, я ищу подружку Мику!', nextId: 'musician_miku' },
    ],
  },
  'musician_end': {
    id: 'musician_end',
    speaker: 'Уличный музыкант Лео',
    text: '*играет тревожную мелодию* Будь осторожна на мосту, маленькая героиня! 🎶',
  },

  // Shopkeeper
  'shop_start': {
    id: 'shop_start',
    speaker: 'Продавец Ханс',
    text: 'Добро пожаловать в мой магазин! У нас сегодня скидка на... подожди, ты же ребёнок. Что тебе нужно?',
    responses: [
      { text: 'Вы видели девочку с розовым бантиком? Это моя подруга Мику!', nextId: 'shop_miku' },
      { text: 'А что у вас есть интересного?', nextId: 'shop_items' },
    ],
  },
  'shop_miku': {
    id: 'shop_miku',
    speaker: 'Продавец Ханс',
    text: 'Да-да, она заходила! Купила фонарик и карту подземелий... Подземелий?! Я думал это для школьного проекта, но...',
    questUpdate: 'Мику купила фонарик и карту подземелий в магазине Ханса. Куда она собралась?!',
    responses: [
      { text: 'Карту подземелий?! А где эти подземелья?', nextId: 'shop_dungeons' },
    ],
  },
  'shop_items': {
    id: 'shop_items',
    speaker: 'Продавец Ханс',
    text: 'Для такой стильной леди в капюшоне Куроми... может, фонарик? Очень полезная вещь ночью!',
    responses: [
      { text: 'Нет, спасибо. Я ищу свою подружку!', nextId: 'shop_miku' },
    ],
  },
  'shop_dungeons': {
    id: 'shop_dungeons',
    speaker: 'Продавец Ханс',
    text: 'Под старым красным зданием у канала есть вход. Но туда НЕЛЬЗЯ ходить детям! Хотя... твоя подруга, кажется, не знала этого правила.',
    questUpdate: 'Под красным зданием у канала есть вход в подземелья. Мику могла пойти туда!',
  },
};

export const npcs: NPC[] = [
  {
    id: 'oldlady',
    name: 'Бабушка Роза',
    pos: { x: 8, y: 6 },
    dialogueId: 'oldlady_start',
    icon: '👵',
    hasInteracted: false,
    description: 'Добрая старушка с корзинкой',
  },
  {
    id: 'musician',
    name: 'Музыкант Лео',
    pos: { x: 20, y: 15 },
    dialogueId: 'musician_start',
    icon: '🎸',
    hasInteracted: false,
    description: 'Уличный музыкант с гитарой',
  },
  {
    id: 'shopkeeper',
    name: 'Продавец Ханс',
    pos: { x: 32, y: 8 },
    dialogueId: 'shop_start',
    icon: '🏪',
    hasInteracted: false,
    description: 'Владелец магазинчика',
  },
];
