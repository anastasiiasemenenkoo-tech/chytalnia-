import { ConfirmEmailForm } from "@/components/account/confirm-email-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";

/**
 * Not in `AUTH_PAGES` on purpose: the person following this link is usually
 * still signed in, and the redirect that guards /login would bounce them to
 * the dashboard before they could confirm anything.
 */
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const dict = await getDictionary();

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{dict.account.confirmTitle}</CardTitle>
          <CardDescription>{dict.account.confirmInvalid}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ConfirmEmailForm token={token} />;
}
