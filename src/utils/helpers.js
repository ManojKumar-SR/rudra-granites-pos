// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const today = () => new Date().toISOString().split("T")[0];
