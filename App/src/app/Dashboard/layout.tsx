import type { ReactNode } from 'react';
import AdminSidebar from './components/Sidebar';
import AdminNavbar from './components/Navbar';
import AuthGuard from './AuthGuard';

const AdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminSidebar />
      <AdminNavbar />
      <AuthGuard />

      <main className="flex min-h-screen flex-col justify-center pt-6 xl:ml-62.5">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;