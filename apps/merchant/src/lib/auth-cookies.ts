const authCookiePrefix = "cashback-merchant";

export const sessionTokenCookieName = `${authCookiePrefix}.session-token`;

export const sessionTokenCookieCandidates = [
  sessionTokenCookieName,
  `__Secure-${sessionTokenCookieName}`,
  `__Host-${sessionTokenCookieName}`,
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};
