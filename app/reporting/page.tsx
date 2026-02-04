"use client"

import { Suspense } from "react"
import { LazyReportingPage } from "@/components/lazy"
import { PageLoader } from "@/components/ui/spinner"

export default function Reporting() {
  return (
    <Suspense fallback={<PageLoader message="Loading reporting..." />}>
      <LazyReportingPage />
    </Suspense>
  )
}
