import { DataProvider } from "@/app/context/data-context";
import { UserProvider } from "@/app/context/user-context";
import { DataTableAdminKonsultasi } from "@/components/data-table-admin-konsultasi";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AdminKonsultasiPageLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[500px]" />
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="overflow-x-hidden">
      <UserProvider>
        <DataProvider>
          <Suspense fallback={<AdminKonsultasiPageLoading />}>
            <DataTableAdminKonsultasi data={[]} />
          </Suspense>
        </DataProvider>
      </UserProvider>
    </div>
  );
}
