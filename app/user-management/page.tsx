"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazyUserManagementPage } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ProtectedRoute requiredRole={["admin", "super_admin"]}>
      <Suspense fallback={<PageLoader message="Loading user management..." />}>
        <LazyUserManagementPage />
      </Suspense>
    </ProtectedRoute>
  )
}
