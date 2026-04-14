import AuthInterceptor from "@/components/auth-interceptor";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthInterceptor />
      {children}
    </>
  );
}
