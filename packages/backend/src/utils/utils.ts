export function isURL(optionalUrl: string) {
  try {
    new URL(optionalUrl);
    return true;
  } catch {
    return false;
  }
}
