export function formatIrishDate(value: string | Date) {
  return new Date(value).toLocaleString("en-IE", {
    timeZone: "Europe/Dublin",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
}

export function formatIsoDate(value: string | Date) {
  return new Date(value).toISOString();
}