'use client';

import { Inter } from 'next/font/google';
import Chatbot from '@/components/Chatbot';

const inter = Inter({ subsets: ['latin'] });

export default function StudentDashboardLayout({ children }) {
  return (
    <div className={inter.className}>
      {children}
      <Chatbot />
    </div>
  );
} 