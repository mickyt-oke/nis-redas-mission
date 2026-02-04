"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazyArchivingPage } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader message="Loading archiving..." />}>
        <LazyArchivingPage />
      </Suspense>
    </ProtectedRoute>
  )
}
