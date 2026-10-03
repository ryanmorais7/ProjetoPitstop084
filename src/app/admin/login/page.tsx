import { redirect } from "next/navigation";
import { ADMIN_SEM_SENHA } from "@/lib/adminAuth";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  if (ADMIN_SEM_SENHA) redirect("/admin/agendamentos");

  return (
    <div className="flex min-h-screen items-center justify-center bg-asphalt px-6">
      <LoginForm />
    </div>
  );
}
