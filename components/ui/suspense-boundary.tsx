import { Suspense, type ReactNode } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

/**
 * Reusable Suspense boundary with default loading fallback
 */
export function SuspenseBoundary({ 
  children, 
  fallback,
  className 
}: SuspenseBoundaryProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className={`flex items-center justify-center min-h-[400px] ${className || ''}`}>
            <LoadingSpinner />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Page-level Suspense boundary with full-page loading
 */
export function PageSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Loading page...</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Section-level Suspense boundary for page sections
 */
export function SectionSuspenseBoundary({ 
  children, 
  title 
}: { 
  children: ReactNode
  title?: string 
}) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-2">
            <LoadingSpinner />
            {title && (
              <p className="text-sm text-muted-foreground">Loading {title}...</p>
            )}
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Card-level Suspense boundary for smaller components
 */
export function CardSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
