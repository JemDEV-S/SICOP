export function absoluteUrl(path: string, request: Request) {
  const configuredUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL;
  if (configuredUrl) {
    return new URL(path, withTrailingSlash(configuredUrl));
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (host && !host.startsWith("0.0.0.0")) {
    const proto = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return new URL(path, `${proto}://${host}`);
  }

  return new URL(path, request.url);
}

function withTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}
