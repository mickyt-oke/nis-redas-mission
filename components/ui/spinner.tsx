import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Lightweight spinner component for Suspense boundaries
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={cn(
        'inline-block rounded-full border-gray-200 border-t-[#1b7b3c] border-r-[#1b7b3c] animate-spin',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Full page loading component
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

/**
 * Section loading component
 */
export function SectionLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-2">
        <Spinner size="md" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}

/**
 * Inline loading component
 */
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-4">
      <Spinner size="sm" />
    </div>
  )
}
