import type { ClassInfo } from './api';

export const DEFAULT_CLASS_LIST: ClassInfo[] = [
  { id: 1, name: '이얼챌' },
  { id: 2, name: '캔디마' },
  { id: 3, name: '미템나' },
  { id: 4, name: '에그작' },
  { id: 5, name: '나컬작' },
  { id: 6, name: '에그작챌' },
  { id: 7, name: '나컬작챌' },
  { id: 8, name: '캔디수' },
  { id: 9, name: '나캔디' },
  { id: 10, name: '미치나' },
];

export const DEFAULT_CLASS_NAME_BY_ID = new Map(
  DEFAULT_CLASS_LIST.map((classInfo) => [classInfo.id, classInfo.name] as const),
);

export const DEFAULT_CLASS_NAMES = DEFAULT_CLASS_LIST.map((classInfo) => classInfo.name);
