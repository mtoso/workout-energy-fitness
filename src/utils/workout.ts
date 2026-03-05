export const parseRestTime = (restStr: string): number => {
  if (!restStr) return 60;

  let totalSeconds = 0;
  const minMatch = restStr.match(/(\d+)'/);
  const secMatch = restStr.match(/(\d+)"/);

  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
  if (secMatch) totalSeconds += parseInt(secMatch[1], 10);

  return totalSeconds > 0 ? totalSeconds : 60;
};

export const getTargetForSet = (
  repsStr: string,
  setIndex: number,
  totalSets: number
): string => {
  if (!repsStr || typeof repsStr !== 'string') return repsStr;
  if (!repsStr.includes('-')) return repsStr;

  const parts = repsStr.split('-').map((s) => s.trim());

  if (parts.length === 2 && totalSets > 2) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    if (!Number.isNaN(first) && !Number.isNaN(second) && first < second) {
      return repsStr;
    }
  }

  return parts[setIndex] || parts[parts.length - 1];
};
