import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors duration-150 ${
    isActive
      ? 'text-civic-primary border-civic-primary'
      : 'text-slate-600 border-transparent hover:text-civic-ink hover:border-slate-300'
  }`;

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-civic-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-civic-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-civic-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-8">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex items-center gap-2 sm:gap-2.5 min-w-0 font-display text-[15px] sm:text-lg font-extrabold tracking-tight text-civic-ink sm:whitespace-nowrap sm:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-civic-primary rounded-sm"
          >
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="h-7 sm:h-8 w-auto object-contain shrink-0"
            />
            <span className="truncate">BetterLGU CivicSponsor</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-8">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/projects" className={navLinkClass}>
              Projects
            </NavLink>
            <NavLink to="/manage" className={navLinkClass}>
              Manage
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/submit"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg shadow-[0_1px_2px_rgba(0,56,168,0.2)] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-primary"
            >
              Submit a Project
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="md:hidden bg-white border-t border-civic-border px-4 py-4 space-y-1 shadow-sm max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3.5 py-3 text-base font-medium rounded-lg ${
                  isActive
                    ? 'bg-civic-tint text-civic-primary font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3.5 py-3 text-base font-medium rounded-lg ${
                  isActive
                    ? 'bg-civic-tint text-civic-primary font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Projects
            </NavLink>
            <NavLink
              to="/manage"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3.5 py-3 text-base font-medium rounded-lg ${
                  isActive
                    ? 'bg-civic-tint text-civic-primary font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Manage a Listing
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3.5 py-3 text-base font-medium rounded-lg ${
                  isActive
                    ? 'bg-civic-tint text-civic-primary font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              About
            </NavLink>
            <div className="pt-2">
              <Link
                to="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 text-base font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
              >
                Submit a Project
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="bg-civic-surface border-t border-civic-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 pb-10 sm:pb-12 border-b border-civic-border">
            <div className="md:col-span-5 space-y-3.5">
              <Link
                to="/"
                className="inline-flex items-center gap-2.5 font-display text-base font-extrabold tracking-tight text-civic-ink"
              >
                <img
                  src="/logo.png"
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-auto object-contain shrink-0"
                />
                <span>BetterLGU CivicSponsor</span>
              </Link>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                An open, community-driven directory connecting independent Philippine civic
                technology builders with individuals and organizations willing to sponsor domains
                and hosting infrastructure.
              </p>
              <p className="text-xs text-slate-500">
                Inspired by the BetterGovPH and BetterLGU civic technology movement.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h2 className="text-xs font-semibold tracking-wide text-slate-900">Directory</h2>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li>
                  <Link to="/" className="hover:text-civic-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="hover:text-civic-primary transition-colors">
                    Explore Projects
                  </Link>
                </li>
                <li>
                  <Link to="/submit" className="hover:text-civic-primary transition-colors">
                    Submit a Project
                  </Link>
                </li>
                <li>
                  <Link to="/manage" className="hover:text-civic-primary transition-colors">
                    Manage a Listing
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-civic-primary transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h2 className="text-xs font-semibold tracking-wide text-slate-900">Legal</h2>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li>
                  <Link to="/privacy" className="hover:text-civic-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-civic-primary transition-colors">
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h2 className="text-xs font-semibold tracking-wide text-slate-900">
                Community Contact
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Questions about listing a civic tech project or coordinating community support?
              </p>
              <a
                href="https://facebook.com/melmarj0nes23"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-semibold text-civic-primary hover:underline break-all sm:break-normal"
              >
                https://facebook.com/melmarj0nes23
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} BetterLGU CivicSponsor. Independent community-driven
              directory.
            </p>
            <p>Direct sponsor-to-maintainer coordination · No payment processing</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
