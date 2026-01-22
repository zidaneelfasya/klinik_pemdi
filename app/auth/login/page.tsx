import { LoginForm } from "@/components/login-form";
import { AuthLayout } from "@/components/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm className="w-full max-w-sm" />
    </AuthLayout>
  );
}
