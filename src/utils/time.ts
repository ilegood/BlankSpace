export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) {
    return '방금 전';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `수정 ${diffMin}분 전`;
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `수정 ${diffHour}시간 전`;
  }
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) {
    return '수정 어제';
  }
  if (diffDays < 7) {
    return `수정 ${diffDays}일 전`;
  }
  const date = new Date(timestamp);
  return `수정 ${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

