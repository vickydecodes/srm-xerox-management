export function camelToTitle(str = '') {
  return str
    // insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // handle snake_case just in case
    .replace(/_/g, ' ')
    // trim & capitalize each word
    .replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.slice(1)
    )
    .trim();
}


export const capitalize = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const money = (v) => Number(v || 0).toLocaleString();

