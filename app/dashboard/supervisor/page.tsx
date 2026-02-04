"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazySupervisorDashboard } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ProtectedRoute requiredRole="supervisor">
      <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
        <LazySupervisorDashboard />
      </Suspense>
    </ProtectedRoute>
  )
}
