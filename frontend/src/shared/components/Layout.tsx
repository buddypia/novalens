import { Outlet, Link, useLocation } from 'react-router-dom';
import { Scan, History, Github, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@shared/hooks/use-theme';

const NAV_ITEMS = [
  { to: '/', label: 'Analyze', icon: Scan },
  { to: '/history', label: 'History', icon: History },
] as const;

export function Layout() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scan className="h-4 w-4" />
            </div>
            <span>NovaLens</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              BETA
            </span>
          </Link>

          <nav className="ml-8 flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  pathname === to
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              Powered by Amazon Nova 2 Lite
            </span>
            <div
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              onClick={toggleTheme}
              title={`Current: ${theme}. Click to toggle.`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </div>
            <a
              href="https://github.com/buddypia/novalens"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        NovaLens &mdash; AI Visual Code Review Agent | AWS Hackathon 2026
      </footer>
    </div>
  );
}
