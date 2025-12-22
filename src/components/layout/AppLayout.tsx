import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopHeader from './TopHeader';

export default function AppLayout() {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/reader/');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isReaderPage && <TopHeader />}
      <main className={`flex-1 ${isReaderPage ? '' : 'pb-20'}`}>
        <Outlet />
      </main>
      {!isReaderPage && <BottomNav />}
    </div>
  );
}
