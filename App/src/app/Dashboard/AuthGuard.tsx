'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CHECK_AUTH } from '@api';
import apiClient from '@apiClient';

const clearClientSession = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('auth-storage');
};

const AuthGuard = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      try {
        await apiClient.get(CHECK_AUTH);
      } catch {
        if (active) {
          clearClientSession();
          router.replace(`/Auth/Login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    };

    void verifySession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return null;
};

export default AuthGuard;
