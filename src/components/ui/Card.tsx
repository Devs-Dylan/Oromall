import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-glass p-6', className)} {...props}>{children}</div>
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-display font-bold text-foreground', className)} {...props}>{children}</h3>
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props}>{children}</div>
}

export function StatCard({ icon, label, value, subtitle, trend, color = 'orange' }: {
  icon: React.ReactNode; label: string; value: string | number; subtitle?: string; trend?: string; color?: 'orange' | 'green' | 'blue' | 'purple'
}) {
  const colors = {
    orange: 'from-orange-500 to-amber-400',
    green: 'from-emerald-500 to-green-400',
    blue: 'from-blue-500 to-cyan-400',
    purple: 'from-violet-500 to-purple-400',
  }
  return (
    <div className="stat-card group hover:-translate-y-0.5 transition-all duration-300">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br mb-3', colors[color])}>
        {icon}
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {trend && <p className="text-xs text-emerald-600 font-medium">{trend}</p>}
    </div>
  )
}
