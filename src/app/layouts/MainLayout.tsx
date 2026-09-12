import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
