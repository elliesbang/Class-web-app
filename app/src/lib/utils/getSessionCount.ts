export function getSessionCount(className: string) {
  if (["캔디마", "이얼챌"].includes(className)) return 10;
  if (["캔디업", "중캘업"].includes(className)) return 8;
  if (["캔굿즈", "캘굿즈"].includes(className)) return 4;
  if (["에그작", "에그작챌", "나컬작", "나컬작챌"].includes(className)) return 1;
  return 1; // default fallback (use DB values when available)
}
