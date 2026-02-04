"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazyAdminDashboard } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ProtectedRoute requiredRole={["admin"]}>
      <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
        <LazyAdminDashboard />
      </Suspense>
    </ProtectedRoute>
  )
}
