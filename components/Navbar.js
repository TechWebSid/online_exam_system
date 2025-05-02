'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { label: 'Home', href: '#' },
        { label: 'Features', href: '#features' },
        { label: 'Exams', href: '#exams' },
        { label: 'Anti-Cheating', href: '#anti-cheating' },
        { label: 'Testimonials', href: '#testimonials' },
        { label: 'Contact', href: '#contact' },
        { label: 'Login', href: '/login' },
    ];

    return (
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold text-blue-600">
                            ExamSecure
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {menuItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`px-3 py-2 rounded-md text-sm font-medium
                                    ${item.label === 'Login'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                       
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
                        {menuItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`block px-3 py-2 rounded-md text-base font-medium
                                    ${item.label === 'Login'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <button className="w-full mt-2 px-4 py-2 rounded-md text-base font-medium bg-green-600 text-white hover:bg-green-700">
                            Take an Exam
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
} 