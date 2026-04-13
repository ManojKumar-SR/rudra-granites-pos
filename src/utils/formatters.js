export const formatCurrency = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);
export const formatDate = (d) => { const dt = new Date(d); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }); };

// ─── NUMBER TO WORDS ─────────────────────────────────────────────────────────
export function numberToWords(num) {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Lakh", "Crore"];
  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);
  let result = "";
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
  };
  if (integer === 0) result = "Zero";
  else {
    const parts = [];
    let n = integer;
    parts.push(n % 1000); n = Math.floor(n / 1000);
    while (n > 0) { parts.push(n % 100); n = Math.floor(n / 100); }
    result = parts.map((p, i) => p ? convert(p) + " " + scales[i] : "").reverse().join(" ").trim();
  }
  if (decimal > 0) result += " and " + convert(decimal) + " Paise";
  return result;
}
