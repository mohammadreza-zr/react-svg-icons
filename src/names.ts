export function splitWords(value: string): string[] {
  const normalized = String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

function capitalizeWord(word: string): string {
  if (/^\d+$/.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function cleanIconName(
  fileName: string,
  folderName: string,
  removeWords: readonly string[],
): string {
  let words = splitWords(fileName.replace(/\.svg$/i, ""));
  if (words[0]?.toLowerCase() === "icon") {
    words.shift();
    while (words.length && /^\d+$/.test(words[0])) words.shift();
  }
  words = words.filter((w) => !removeWords.includes(w.toLowerCase()));
  const folderWords = new Set(splitWords(folderName).map((w) => w.toLowerCase()));
  words = words.filter((w) => !folderWords.has(w.toLowerCase()));
  if (!words.length) return "Icon";
  let pascal = words.map(capitalizeWord).join("");
  if (/^[0-9]/.test(pascal)) pascal = `Icon${pascal}`;
  pascal = pascal.replace(/[^a-zA-Z0-9]/g, "");
  return pascal || "Icon";
}

export function toKebabCase(str: string): string {
  return String(str)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  const pascal = String(str)
    .replace(/[-_]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+(.)(\w*)/g, (_, $1: string, $2: string) => $1.toUpperCase() + $2.toLowerCase())
    .replace(/^./, (s) => s.toUpperCase());
  let camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  if (/^[0-9]/.test(camel) || !camel) camel = `folder${camel || "Unknown"}`;
  return camel;
}
