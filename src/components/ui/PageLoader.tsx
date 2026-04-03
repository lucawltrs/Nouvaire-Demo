interface PageLoaderProps {
  message?: string;
  subtitle?: string;
  className?: string;
}

export function PageLoader({
  message = 'Lade Daten...',
  subtitle,
  className = '',
}: PageLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[300px] gap-5 ${className}`}>
      {/* Spinner rings */}
      <div className="relative w-14 h-14">
        {/* Outer static ring */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        {/* Spinning brand ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#ED4C27' }}
        />
        {/* Inner smaller counter-ring for depth */}
        <div
          className="absolute inset-[6px] rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: 'rgba(237,76,39,0.35)',
            animationDirection: 'reverse',
            animationDuration: '0.8s',
          }}
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-gray-200 tracking-wide">{message}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
