import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-dark-900 text-gray-400 py-8 mt-auto">
        <div className="section-container text-center">
          <p className="font-display text-xl font-bold text-white mb-2">
            🍛 Khaana
          </p>
          <p className="text-sm">
            A DBMS project — Built with PostgreSQL, Express, React & Node.js
          </p>
          <p className="text-xs mt-2 text-gray-500">
            © {new Date().getFullYear()} Khaana. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
