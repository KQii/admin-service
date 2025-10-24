/**
 * Parse time string to seconds
 * Supports formats like: "15m", "1h", "30s", "1d"
 * @param timeString - Time string with unit (e.g., "15m", "1h")
 * @param defaultSeconds - Default value in seconds if parsing fails
 * @returns Time in seconds
 */
export const parseTimeToSeconds = (
  timeString: string,
  defaultSeconds: number = 900
): number => {
  const timeValue = parseInt(timeString);
  const timeUnit = timeString.replace(/[0-9]/g, "");

  switch (timeUnit) {
    case "m": // minutes
      return timeValue * 60;
    case "h": // hours
      return timeValue * 3600;
    case "s": // seconds
      return timeValue;
    case "d": // days
      return timeValue * 86400;
    default:
      return defaultSeconds;
  }
};
