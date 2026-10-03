'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoMdClose,IoMdMenu } from 'react-icons/io';

export default function Navbar() {

  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/note', label: 'Notes' },
    { href: '/project', label: 'Projects' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ];

  const isActiveLink = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  useEffect(() => {

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };

  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-lg bg-[hsl(222.2,84%,4.9%)]/60 transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/home"
            className="text-2xl font-bold text-white"
          >
            Rathod Pratik
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-8">

            {navItems.map((item) => (

              <li key={item.href}>

                <Link
                  href={item.href}
                  className={`transition-colors ${
                    isActiveLink(item.href)
                      ? 'text-orange-500 font-semibold'
                      : 'text-white hover:text-orange-400'
                  }`}
                >
                  {item.label}
                </Link>

              </li>

            ))}

          </ul>
  <div className="flex items-center gap-3">

            <a
              href="mailto:rathodpratik1928@gmail.com"
              className="hidden md:block bg-[#fca61f] text-white px-5 py-2 rounded-full hover:bg-purple-700 transition-all duration-300"
            >
              Hire Me
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden text-white text-3xl"
            >
              <IoMdMenu />
            </button>

          </div>

        </div>

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0 right-0 h-screen w-[80vw] max-w-[320px]
          bg-[#021027] z-50 transition-transform duration-500
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          md:hidden`}
        >

          <div className="p-5 flex justify-end">

            <button
              onClick={() => setIsOpen(false)}
              className="text-white text-3xl"
            >
              <IoMdClose />
            </button>

          </div>

          <ul className="flex flex-col gap-8 px-8 mt-10">

            {navItems.map((item) => (

              <li key={item.href} className="text-center">

                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg ${
                    isActiveLink(item.href)
                      ? 'text-orange-500 font-semibold'
                      : 'text-white'
                  }`}
                >
                  {item.label}
                </Link>

              </li>

            ))}

          </ul>          
          <div className="px-8 mt-10">

            <a
              href="mailto:rathodpratik1928@gmail.com"
              className="block text-center bg-[#fca61f] hover:bg-purple-700 text-white py-3 rounded-full"
            >
              Hire Me
            </a>

          </div>

        </div>

      </nav>
    </>
  );
}