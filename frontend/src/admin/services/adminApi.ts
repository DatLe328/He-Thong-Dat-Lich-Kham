const BASE = "/api/admin/users";

export const getUsers = async () => {
  try {
    const res = await fetch(BASE);
    return await res.json();
  } catch {
    return [];
  }
};

export const createUser = async (data: any) => {
  await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const updateUser = async (id: number, data: any) => {
  await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const deleteUser = async (id: number) => {
  await fetch(`${BASE}/${id}`, { method: "DELETE" });
};

export const triggerGenerateSchedules = async (daysAhead: number) => {
  const res = await fetch("/api/users/admin/schedules/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ daysAhead }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || "Không thể chạy job sinh schedule.");
  }

  return {
    created: json?.data?.created ?? 0,
    daysAhead: json?.data?.daysAhead ?? daysAhead,
  };
};