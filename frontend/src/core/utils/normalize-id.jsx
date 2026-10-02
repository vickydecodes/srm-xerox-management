export const safeId = (ref) => {
  if (!ref) return "";

  if (typeof ref === "object") {
    return ref._id?.toString?.() || ref.id?.toString?.() || "";
  }

  return ref.toString?.() || "";
};
