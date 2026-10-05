'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaCode, FaHome, FaStar, FaUser } from 'react-icons/fa';
import { FaStickyNote } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { IoMailOutline, IoSettingsSharp } from 'react-icons/io5';
import { MdOutlineArticle } from 'react-icons/md';
import { toast } from 'react-toastify';
import { apiClient } from '@apiClient';
import { LOGOUT } from '@api';

const navLinks = [
  { href: '/Dashboard', icon: <FaHome />, label: 'Dashboard' },
  { href: '/Dashboard/Project', icon: <IoSettingsSharp />, label: 'Projects' },
  { href: '/Dashboard/Notes', icon: <FaStickyNote />, label: 'Notes' },
  { href: '/Dashboard/Skills', icon: <FaCode />, label: 'Skills' },
  { href: '/Dashboard/Resume', icon: <FaStar />, label: 'Resume' },
  { href: '/Dashboard/About', icon: <FaUser />, label: 'About' },
  { href: '/Dashboard/Blog', icon: <MdOutlineArticle />, label: 'Blog' },
  { href: '/Dashboard/ContactUS', icon: <IoMailOutline />, label: 'Contact Us' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isActive = (href: string) =>
    href === '/Dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const updateSidebarState = (open: boolean) => {
    setIsOpen(open);
  };

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
      updateSidebarState(!mobile);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    const toggle = () => {
      setIsOpen((open) => !open);
    };
    const close = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen?: boolean }>;
      setIsOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener('admin-sidebar-toggle', toggle);
    window.addEventListener('admin-sidebar-state', close);
    return () => {
      window.removeEventListener('admin-sidebar-toggle', toggle);
      window.removeEventListener('admin-sidebar-state', close);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('admin-sidebar-state', {
        detail: { isOpen },
      }),
    );
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobile && isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, isOpen]);

  const logout = async () => {
    try {
      await apiClient.get(LOGOUT);
      localStorage.removeItem('auth-storage');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close admin sidebar"
          onClick={() => updateSidebarState(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}
      <aside
        className={`sidebar fixed left-0 z-50 border-r border-white/10 bg-[#020817] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } xl:translate-x-0`}
        style={{
          top: 72,
          height: `calc(100vh - 72px)`,
          width: 250,
        }}
        aria-label="Admin sidebar navigation"
      >
        <nav className="flex flex-col gap-1 px-4 py-6">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && updateSidebarState(false)}
              className={`flex items-center gap-4 rounded-md px-4 py-3 transition ${
                isActive(item.href)
                  ? 'bg-blue-500 text-white'
                  : 'text-white hover:bg-blue-500/80'
              }`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 flex items-center gap-4 rounded-md px-4 py-3 text-white transition hover:bg-blue-500/80"
          >
            <FiLogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
