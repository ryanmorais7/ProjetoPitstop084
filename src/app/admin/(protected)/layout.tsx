import { ReactNode } from "react";
import type { Metadata } from "next";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import AdminShell from "@/components/admin/AdminShell";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: "Admin · PitStop084",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await exigirSessaoAdmin();

  return <AdminShell sair={logout}>{children}</AdminShell>;
}
