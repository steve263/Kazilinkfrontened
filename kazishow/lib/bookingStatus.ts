export interface BookingStatusInfo {
  emoji: string;
  title: string;
  message: string;
  color: "green" | "amber" | "blue" | "purple" | "orange" | "red" | "gray";
  showTrackButton: boolean;
  showRateButton: boolean;
}

export function getCustomerStatusMessage(
  status: string,
  scheduledDate: string | Date,
  scheduledTime: string,
  providerName: string,
  category?: string
): BookingStatusInfo {
  const now = new Date();
  const bookingDate = new Date(scheduledDate);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

  const isToday = bookingDay.getTime() === todayStart.getTime();
  const isFuture = bookingDay.getTime() > todayStart.getTime();
  const daysLeft = Math.round((bookingDay.getTime() - todayStart.getTime()) / 86400000);

  const niceDate = bookingDate.toLocaleDateString("en-KE", {
    weekday: "long", month: "long", day: "numeric",
  });

  const isMobile =
    category === "FUNDI" ||
    category === "CLEANING" ||
    category === "SECURITY" ||
    category === "CATERING";

  const name = providerName || "Provider";

  // ── PENDING ──────────────────────────────────────────────────────────────────
  if (status === "PENDING") {
    if (isFuture) {
      return {
        emoji: "⏳",
        title: "Waiting for Confirmation",
        message: daysLeft === 1
          ? `Your booking for tomorrow at ${scheduledTime} is waiting for ${name} to accept. You will get an SMS when confirmed.`
          : `Your booking for ${niceDate} at ${scheduledTime} is waiting for ${name} to accept.`,
        color: "amber",
        showTrackButton: false,
        showRateButton: false,
      };
    }
    return {
      emoji: "⏳",
      title: "Waiting for Confirmation",
      message: `Your booking for today at ${scheduledTime} is waiting for ${name} to accept right now.`,
      color: "amber",
      showTrackButton: false,
      showRateButton: false,
    };
  }

  // ── ACCEPTED ─────────────────────────────────────────────────────────────────
  if (status === "ACCEPTED") {
    if (isFuture) {
      return {
        emoji: "✅",
        title: daysLeft === 1 ? "Confirmed for Tomorrow!" : "Booking Confirmed!",
        message: daysLeft === 1
          ? `${name} confirmed your booking for tomorrow at ${scheduledTime}. You will receive a reminder 1 hour before. 😊`
          : `${name} confirmed your booking for ${niceDate} at ${scheduledTime}. You will receive a reminder the day before.`,
        color: "green",
        showTrackButton: false,
        showRateButton: false,
      };
    }
    return {
      emoji: "✅",
      title: "Confirmed for Today!",
      message: isMobile
        ? `${name} is confirmed for today at ${scheduledTime}. They will notify you when they start heading to your location.`
        : `Your booking at ${name} is confirmed for today at ${scheduledTime}. Please arrive on time.`,
      color: "green",
      showTrackButton: false,
      showRateButton: false,
    };
  }

  // ── EN_ROUTE ─────────────────────────────────────────────────────────────────
  if (status === "EN_ROUTE") {
    return {
      emoji: "🚗",
      title: "Provider is on the Way!",
      message: `${name} is heading to your location right now! They will be there soon.`,
      color: "blue",
      showTrackButton: true,
      showRateButton: false,
    };
  }

  // ── ARRIVED ──────────────────────────────────────────────────────────────────
  if (status === "ARRIVED") {
    return {
      emoji: "📍",
      title: "Provider has Arrived!",
      message: `${name} is at your location. Please let them in! 🎉`,
      color: "purple",
      showTrackButton: true,
      showRateButton: false,
    };
  }

  // ── IN_PROGRESS ──────────────────────────────────────────────────────────────
  if (status === "IN_PROGRESS") {
    return {
      emoji: "⚡",
      title: "Service in Progress",
      message: `${name} is currently working on your service. Please stay available.`,
      color: "orange",
      showTrackButton: false,
      showRateButton: false,
    };
  }

  // ── COMPLETED ────────────────────────────────────────────────────────────────
  if (status === "COMPLETED") {
    return {
      emoji: "🎉",
      title: "Service Complete!",
      message: `Your service with ${name} is done. How was the experience?`,
      color: "green",
      showTrackButton: false,
      showRateButton: true,
    };
  }

  // ── CANCELLED ────────────────────────────────────────────────────────────────
  if (status === "CANCELLED") {
    return {
      emoji: "❌",
      title: "Booking Cancelled",
      message: "This booking has been cancelled.",
      color: "red",
      showTrackButton: false,
      showRateButton: false,
    };
  }

  // ── DECLINED ─────────────────────────────────────────────────────────────────
  if (status === "DECLINED") {
    return {
      emoji: "❌",
      title: "Booking Declined",
      message: `${name} could not accept this booking. Please try booking another provider.`,
      color: "red",
      showTrackButton: false,
      showRateButton: false,
    };
  }

  // ── DEFAULT ──────────────────────────────────────────────────────────────────
  return {
    emoji: "📅",
    title: "Booking Scheduled",
    message: `Your booking is scheduled for ${niceDate} at ${scheduledTime}.`,
    color: "gray",
    showTrackButton: false,
    showRateButton: false,
  };
}

export function getStatusBadgeStyle(color: string): string {
  const styles: Record<string, string> = {
    green:  "bg-green-50 border border-green-200",
    amber:  "bg-amber-50 border border-amber-200",
    blue:   "bg-blue-50 border border-blue-200",
    purple: "bg-purple-50 border border-purple-200",
    orange: "bg-orange-50 border border-orange-200",
    red:    "bg-red-50 border border-red-200",
    gray:   "bg-gray-50 border border-gray-200",
  };
  return styles[color] ?? styles.gray;
}

export function getStatusTextColor(color: string): string {
  const colors: Record<string, string> = {
    green:  "text-green-700",
    amber:  "text-amber-700",
    blue:   "text-blue-700",
    purple: "text-purple-700",
    orange: "text-orange-700",
    red:    "text-red-600",
    gray:   "text-gray-600",
  };
  return colors[color] ?? colors.gray;
}

// Keep old exports as aliases so any other callers don't break
export const getBookingStatusMessage = getCustomerStatusMessage;
export function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700", ACCEPTED: "bg-green-100 text-green-700",
    EN_ROUTE: "bg-blue-100 text-blue-700", ARRIVED: "bg-cyan-100 text-cyan-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700", COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-100 text-gray-600", DECLINED: "bg-red-100 text-red-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}
export function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    PENDING: "⏳", ACCEPTED: "✅", EN_ROUTE: "🚗", ARRIVED: "📍",
    IN_PROGRESS: "⚡", COMPLETED: "🎉", CANCELLED: "❌", DECLINED: "❌",
  };
  return map[status] ?? "📋";
}
