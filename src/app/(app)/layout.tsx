import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { getCurrentUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* min-w-0: without it this flex item takes its automatic minimum size
          and grows to fit its widest child, so a horizontally scrolling row
          inside a page would stretch the whole shell instead of scrolling. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ id: user.id, email: user.email, name: user.name }}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
