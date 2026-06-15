export const CSRF_COOKIE_NAME = "mercato_csrf";
export const CSRF_HEADER_NAME = "X-CSRF-Token";

export function readBrowserCsrfToken() {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${CSRF_COOKIE_NAME}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

export function csrfHeaders(headers: HeadersInit = {}) {
  const token = readBrowserCsrfToken();
  if (!token) return headers;

  return {
    ...Object.fromEntries(new Headers(headers).entries()),
    [CSRF_HEADER_NAME]: token,
  };
}
