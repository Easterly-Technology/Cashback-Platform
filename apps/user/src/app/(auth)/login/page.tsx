import { LoginForm } from "./login-form";

function getSafeCallbackUrl(callbackUrl?: string) {
  return callbackUrl?.startsWith("/") ? callbackUrl : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginForm
      authError={params.error ?? null}
      callbackUrl={getSafeCallbackUrl(params.callbackUrl)}
    />
  );
}
