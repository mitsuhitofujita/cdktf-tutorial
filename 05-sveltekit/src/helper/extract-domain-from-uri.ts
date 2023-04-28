export function extractDomainFromURI(uri: string): string {
  try {
    const url = new URL(uri);
    return url.hostname;
  } catch (err) {}
  return "";
}
