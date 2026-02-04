"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazyUserDashboard } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ProtectedRoute requiredRole={["user"]}>
      <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
        <LazyUserDashboard />
      </Suspense>
    </ProtectedRoute>
  )
}
