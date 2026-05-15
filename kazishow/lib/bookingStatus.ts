export interface StatusMessage {
  emoji: string;
  title: string;
  message: string;
  color: "amber" | "green" | "blue" | "orange" | "red" | "gray";
  showTracking: boolean;
}

export function getBookingStatusMessage(
  status: string,
  scheduledDate: string | Date,
  scheduledTime: string,
  providerName: string,
  category?: string
): StatusMessage {
  const now = new Date();
  const bookingDate = new Date(scheduledDate);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingMidnight = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    bookingDate.getDate()
  );
  const isTodayBooking = bookingMidnight.getTime() === todayMidnight.getTime();
  const isFutureBooking = bookingMidnight.getTime() > todayMidnight.getTime();
  const daysUntil = Math.round(
    (bookingMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
  const formattedDate = bookingDate.toLocaleDateString("en-KE", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const name = providerName || "Provider";

  switch (status) {
    case "PENDING":
      return {
        emoji: "⏳",
        title: "Awaiting Confirmation",
        message: "Waiting for provider to accept your booking",
        color: "amber",
        showTracking: false,
      };

    case "ACCEPTED":
      if (isFutureBooking) {
        const dayLabel = daysUntil === 1 ? "tomorrow" : `on ${formattedDate}`;
        return {
          emoji: "✅",
          title: "Booking Confirmed!",
          message: `Booking confirmed! ${name} will arrive ${dayLabel} at ${scheduledTime}`,
          color: "green",
          showTracking: false,
        };
      }
      if (isTodayBooking) {
        return {
          emoji: "✅",
          title: "Confirmed for Today!",
          message: `Provider accepted! They will arrive at ${scheduledTime} today`,
          color: "green",
          showTracking: false,
        };
      }
      return {
        emoji: "✅",
        title: "Booking Confirmed",
        message: `${name} accepted your booking`,
        color: "green",
        showTracking: false,
      };

    case "EN_ROUTE":
      return {
        emoji: "🚗",
        title: "On The Way!",
        message: "Provider is on the way to your location",
        color: "blue",
        showTracking: true,
      };

    case "ARRIVED":
      return {
        emoji: "📍",
        title: "Provider Arrived!",
        message: `${name} has arrived at your location`,
        color: "green",
        showTracking: true,
      };

    case "IN_PROGRESS":
      return {
        emoji: "⚡",
        title: "Service in Progress",
        message: "Service is in progress",
        color: "orange",
        showTracking: true,
      };

    case "COMPLETED":
      return {
        emoji: "🎉",
        title: "Service Complete!",
        message: "Service complete! Please rate your experience",
        color: "green",
        showTracking: false,
      };

    case "CANCELLED":
      return {
        emoji: "❌",
        title: "Booking Cancelled",
        message: "Booking was cancelled",
        color: "red",
        showTracking: false,
      };

    case "DECLINED":
      return {
        emoji: "❌",
        title: "Booking Declined",
        message: "Booking was cancelled",
        color: "red",
        showTracking: false,
      };

    default:
      return {
        emoji: "📋",
        title: status,
        message: "Booking status updated",
        color: "gray",
        showTracking: false,
      };
  }
}

export function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    PENDING:     "bg-amber-100 text-amber-700",
    ACCEPTED:    "bg-green-100 text-green-700",
    EN_ROUTE:    "bg-blue-100 text-blue-700",
    ARRIVED:     "bg-cyan-100 text-cyan-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED:   "bg-emerald-100 text-emerald-700",
    CANCELLED:   "bg-gray-100 text-gray-600",
    DECLINED:    "bg-red-100 text-red-600",
    PREPARING:   "bg-amber-100 text-amber-700",
    READY:       "bg-teal-100 text-teal-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    PENDING:     "⏳",
    ACCEPTED:    "✅",
    EN_ROUTE:    "🚗",
    ARRIVED:     "📍",
    IN_PROGRESS: "⚡",
    COMPLETED:   "🎉",
    CANCELLED:   "❌",
    DECLINED:    "❌",
    PREPARING:   "👨‍🍳",
    READY:       "✅",
  };
  return map[status] ?? "📋";
}
