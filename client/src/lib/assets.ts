// CDN URLs for all game assets — Cyber Noir Casino theme
export const ASSETS = {
  table: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/fdKWDrtowBxZScpD.png',
  gameBg: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/zmSscHBYXynwTLYD.png',
  lobbyBg: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/EVjTcVHbeDnNZyXv.png',
  chips: {
    gold: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/OeYXoBnVYDgYxZvG.png',
    red: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/SNvKozjZFOiBovoo.png',
    blue: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/hpPUbJMyMWaxJBUq.png',
    green: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/nmAfYDDrgnEyOecI.png',
    black: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/lbCcIhHsVwOeumdy.png',
  },
  ui: {
    coin: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/qkovZJxUcAwdDRtp.png',
    gem: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/jDRhUwfGhtUNoGCR.png',
    trophy: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/AWgUVQIcKzBRtswK.png',
    crown: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/sEZIzNlFJWAEKdhD.png',
    lootbox: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/BLJCRdtvxBUWfvxY.png',
  },
  avatars: {
    fox: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/ZXVgoVBnaGWTdBpA.png',
    shark: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/FpeUSrnFoZnRZGTJ.png',
    owl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/XKAtsYjYeUrpYXGB.png',
    cat: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/oaVDgFqlzeJnZXRb.png',
    bear: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/hiGFoFAZwxbmEqUq.png',
    monkey: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/yaUaOFMxFINVZTMf.png',
    wolf: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/KFgHpHCxeiLwzNMK.png',
    penguin: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/wXzTgbjNbMLqgWZp.png',
    flamingo: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/wrIuKUnyHMQYnFjy.png',
    koala: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663292314986/oAfRKfzoWQBFSpTZ.png',
  },
} as const;

export const AVATAR_LIST = Object.entries(ASSETS.avatars).map(([key, url]) => ({
  id: key,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  url,
}));

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#E53935',
  diamonds: '#E53935',
  clubs: '#263238',
  spades: '#263238',
};
