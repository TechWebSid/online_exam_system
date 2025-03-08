'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, BookOpenIcon, DocumentTextIcon, 
  AcademicCapIcon, UserGroupIcon, ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin-dashboard', icon: HomeIcon },
  { name: 'Subjects', href: '/admin-dashboard/subjects', icon: BookOpenIcon },
  { name: 'Exams', href: '/admin-dashboard/exams', icon: DocumentTextIcon },
  { name: 'Questions', href: '/admin-dashboard/questions', icon: ClipboardDocumentListIcon },
  { name: 'Students', href: '/admin-dashboard/students', icon: UserGroupIcon },
  { name: 'Results', href: '/admin-dashboard/results', icon: AcademicCapIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
} 