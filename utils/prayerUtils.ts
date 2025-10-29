interface PrayerTime {
  name: string;
  time: string;
  period: string;
  originalTime: string; // Make this required, not optional
}

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

export const formatPrayerTimes = (timings: any): PrayerTime[] => {
  // Return empty array if timings is null or undefined
  if (!timings) {
    return [];
  }

  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Sunrise", time: timings.Sunrise },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha },
  ];

  return prayers
    .filter((prayer) => prayer.time && typeof prayer.time === "string") // Filter out invalid times
    .map((prayer) => {
      const [hours, minutes] = prayer.time.split(":").map(Number);

      // Skip if time parsing failed
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

      return {
        name: prayer.name,
        time: `${displayHours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`,
        period,
        originalTime: prayer.time, // Always include this as required
      };
    })
    .filter((prayer) => prayer !== null); // Remove null entries
};

export const findCurrentAndNextPrayer = (
  prayerTimes: PrayerTime[]
): { current: PrayerTime | null; next: PrayerTime | null } => {
  if (!prayerTimes.length) return { current: null, next: null };

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  let current: PrayerTime | null = null;
  let next: PrayerTime | null = null;

  // Find current prayer (the last prayer that has passed)
  for (let i = 0; i < prayerTimes.length; i++) {
    const prayer = prayerTimes[i];
    const [hours, minutes] = prayer.originalTime.split(":").map(Number);
    const prayerTime = hours * 60 + minutes;

    if (currentTime >= prayerTime) {
      current = prayer;
    } else if (!next) {
      next = prayer;
      break;
    }
  }

  // If no next prayer found (after Isha), next prayer is Fajr of next day
  if (!next && prayerTimes.length > 0) {
    next = prayerTimes[0]; // Fajr
  }

  return { current, next };
};

export const calculateCountdown = (nextPrayerTime: string): CountdownTime => {
  const now = new Date();
  const [hours, minutes] = nextPrayerTime.split(":").map(Number);

  const nextPrayer = new Date();
  nextPrayer.setHours(hours, minutes, 0, 0);

  // If the prayer time has passed today, set it for tomorrow
  if (nextPrayer <= now) {
    nextPrayer.setDate(nextPrayer.getDate() + 1);
  }

  const diff = nextPrayer.getTime() - now.getTime();
  const totalSeconds = Math.floor(diff / 1000);

  const countdownHours = Math.floor(totalSeconds / 3600);
  const countdownMinutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: countdownHours,
    minutes: countdownMinutes,
    seconds,
  };
};

// Check if current time is exactly prayer time (within specified minutes)
export const isCurrentlyPrayerTime = (
  prayerTime: string,
  withinMinutes = 1
): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [hours, minutes] = prayerTime.split(":").map(Number);
  const targetTime = hours * 60 + minutes;

  return Math.abs(currentTime - targetTime) <= withinMinutes;
};

// Export the PrayerTime type for use in other files
export type { CountdownTime, PrayerTime };
