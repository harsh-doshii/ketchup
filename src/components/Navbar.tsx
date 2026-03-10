import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { TimezoneClock } from '@/components/TimezoneClock'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/availability/setup', label: 'Availability' },
]

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-sm font-semibold tracking-tight flex-shrink-0">
            Ketchup
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            {NAV_LINKS.map(({ to, label }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/')
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-2 py-1 rounded-md transition-colors',
                    active
                      ? 'text-foreground bg-muted'
                      : 'hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <TimezoneClock />
          <button
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
