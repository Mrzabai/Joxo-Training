const OWNER_COOKIE = "joxo_owner";
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function ownerFrom(request: Request) {
  const accountEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (accountEmail) return `account:${accountEmail}`;

  const token = request.headers.get("x-joxo-owner") ?? cookieValue(request, OWNER_COOKIE);
  return token && TOKEN_PATTERN.test(token) ? `device:${token.toLowerCase()}` : null;
}
