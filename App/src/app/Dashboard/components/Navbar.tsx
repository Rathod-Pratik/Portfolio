'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBell, FiFileText, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleSidebarState = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen?: boolean }>;
      setSidebarOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener('admin-sidebar-state', handleSidebarState);
    return () => window.removeEventListener('admin-sidebar-state', handleSidebarState);
  }, []);

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('admin-sidebar-toggle'));
  };

  return (
    <header
      className="fixed left-0 right-0 top-0 z-60 border-b border-white/10 bg-[hsl(222.2,84%,4.9%)]/90 backdrop-blur-lg"
      style={{ height: 72 }}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-full bg-blue-500 p-2 text-white transition hover:bg-blue-600 xl:hidden"
            aria-label={sidebarOpen ? 'Close admin sidebar' : 'Open admin sidebar'}
          >
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
          <Link href="/Dashboard" className="text-2xl font-bold text-white">
            Portfolio Admin
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/Dashboard/Logger"
            title="System logs"
            aria-label="Open system logs"
            className={`rounded-full p-2 text-xl transition ${
              pathname.startsWith('/Dashboard/Logger')
                ? 'bg-blue-500 text-white'
                : 'text-white hover:bg-white/10 hover:text-blue-300'
            }`}
          >
            <FiFileText />
          </Link>
          <Link
            href="/Dashboard/Notifications"
            title="Notifications"
            aria-label="Open notifications"
            className={`rounded-full p-2 text-xl transition ${
              pathname.startsWith('/Dashboard/Notifications')
                ? 'bg-blue-500 text-white'
                : 'text-white hover:bg-white/10 hover:text-blue-300'
            }`}
          >
            <FiBell />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
