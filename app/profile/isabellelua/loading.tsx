export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-md mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-20 w-20 bg-muted rounded-full"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-20 bg-muted rounded-full"></div>
            <div className="h-8 w-8 bg-muted rounded-full"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-6 w-32 bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-3/4 bg-muted rounded"></div>
        </div>
        <div className="flex justify-around py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-6 w-12 bg-muted rounded mx-auto"></div>
              <div className="h-3 w-16 bg-muted rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
