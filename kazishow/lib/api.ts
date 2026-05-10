const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function logout() {
  localStorage.removeItem("kazishow_token");
  localStorage.removeItem("kazishow_user");
  window.location.href = "/auth/login";
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("kazishow_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  // Auto-logout on stale token
  if (res.status === 401) {
    const clone = res.clone();
    try {
      const data = await clone.json();
      if (data.message === "User no longer exists" || data.message === "Invalid or expired token") {
        logout();
      }
    } catch {}
  }

  // If account suspended — update localStorage and reload to trigger SuspensionGate
  if (res.status === 403) {
    const clone = res.clone();
    try {
      const data = await clone.json();
      if (data.code === "ACCOUNT_SUSPENDED") {
        const userRaw = localStorage.getItem("kazishow_user");
        if (userRaw) {
          const user = JSON.parse(userRaw);
          user.isSuspended = true;
          localStorage.setItem("kazishow_user", JSON.stringify(user));
        }
        window.location.reload();
      }
    } catch {}
  }

  return res;
}

export { API };
