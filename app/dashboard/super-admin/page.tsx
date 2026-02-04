"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazySuperAdminDashboard } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ProtectedRoute requiredRole={["super_admin"]}>
      <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
        <LazySuperAdminDashboard />
      </Suspense>
    </ProtectedRoute>
  )
}
