import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";

export default async function ResetPasswordPage({
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
          <CardTitle>{dict.auth.resetPasswordTitle}</CardTitle>
          <CardDescription>{dict.auth.resetInvalidToken}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
