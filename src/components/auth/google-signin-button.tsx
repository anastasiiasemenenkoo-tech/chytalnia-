"use client";

import { signInWithGoogleAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.42 3.58v3h3.91c2.29-2.11 3.53-5.21 3.53-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.91-3c-1.09.73-2.48 1.15-4.02 1.15-3.09 0-5.71-2.09-6.65-4.89H1.32v3.09C3.29 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.35 14.35c-.24-.73-.38-1.5-.38-2.35s.14-1.62.38-2.35V6.56H1.32C.48 8.24 0 10.06 0 12s.48 3.76 1.32 5.44l4.03-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.29 2.7 1.32 6.56l4.03 3.09c.94-2.8 3.56-4.9 6.65-4.9z"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  const dict = useDict();
  return (
    <form action={signInWithGoogleAction}>
      <Button type="submit" variant="outline" className="w-full gap-2">
        <GoogleIcon />
        {dict.auth.continueWithGoogle}
      </Button>
    </form>
  );
}
