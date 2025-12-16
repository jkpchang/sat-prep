export const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Compare date strings directly (YYYY-MM-DD format)
  const today = getTodayString();
  return dateString === today;
};

export const isYesterday = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Get yesterday's date string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  
  return dateString === yesterdayString;
};

export const getTodayString = (): string => {
  // Use local date, not UTC, to match user's timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

