export const AVATAR_OPTIONS = [
  '👤', '🧑', '👨', '👩', '🧔', '👱', '🧑‍🦱', '👨‍🦱', '👩‍🦱', '🧑‍🦰',
  '👨‍🦰', '👩‍🦰', '👱‍♂️', '👱‍♀️', '🧑‍🦲', '👨‍🦲', '👩‍🦲', '🧑‍🦳',
  '👨‍🦳', '👩‍🦳', '🧓', '👴', '👵', '🙍', '🙎', '🧙', '🧚', '🧛'
];

export const getAvatarByIndex = (index: number): string => {
  return AVATAR_OPTIONS[index] || AVATAR_OPTIONS[0];
};

export const getAvatarIndex = (avatar: string): number => {
  const index = AVATAR_OPTIONS.indexOf(avatar);
  return index !== -1 ? index : 0;
};

export const DEFAULT_AVATAR_INDEX = 0;