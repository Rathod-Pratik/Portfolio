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

      <main className="min-h-screen pt-18 xl:ml-64">
        <div className="p-4 pt-6 sm:p-6 sm:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;