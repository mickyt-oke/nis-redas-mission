"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { LazyMissionsPage } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export const metadata = {
  title: 'REDAS | Diplomatic Missions',
  description: 'Manage and track field missions for the Nigeria Immigration Service',
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader message="Loading missions..." />}>
        <LazyMissionsPage />
      </Suspense>
    </ProtectedRoute>
  )
}
