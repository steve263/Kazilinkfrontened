type BookingAction = {
  bookingId: string;
  action: "ACCEPTED" | "DECLINED";
  timestamp: number;
};

const actionedBookings = new Map<string, BookingAction>();
const listeners = new Set<(bookingId: string, action: "ACCEPTED" | "DECLINED") => void>();

export const bookingState = {
  setActioned(bookingId: string, action: "ACCEPTED" | "DECLINED") {
    actionedBookings.set(bookingId, { bookingId, action, timestamp: Date.now() });
    listeners.forEach((fn) => fn(bookingId, action));
  },

  isActioned(bookingId: string) {
    return actionedBookings.has(bookingId);
  },

  getAction(bookingId: string) {
    return actionedBookings.get(bookingId);
  },

  subscribe(fn: (bookingId: string, action: "ACCEPTED" | "DECLINED") => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
