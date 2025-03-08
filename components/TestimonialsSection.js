'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const testimonials = [
    {
        id: 1,
        name: 'Rahul',
        role: 'IIT Student',
        image: '/avatars/student1.jpg',
        rating: 5,
        text: 'The best online exam platform I\'ve ever used! AI proctoring works flawlessly.',
    },
    {
        id: 2,
        name: 'Ananya',
        role: 'BTech Student',
        image: '/avatars/student2.jpg',
        rating: 5,
        text: 'Secure and easy-to-use. No more cheating!',
    },
    {
        id: 3,
        name: 'Priya',
        role: 'MCA Student',
        image: '/avatars/student3.jpg',
        rating: 5,
        text: 'The interface is so intuitive, and the anti-cheating features are impressive.',
    },
    {
        id: 4,
        name: 'Arjun',
        role: 'Engineering Student',
        image: '/avatars/student4.jpg',
        rating: 5,
        text: 'Perfect platform for online assessments. The AI monitoring is non-intrusive yet effective.',
    },
];

export function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    // Auto-scroll testimonials
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-white relative overflow-hidden">
            {/* Floating elements background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                        What Our Users Say
                    </h2>
                    <p className="text-lg text-gray-600">
                        Trusted by thousands of students across India
                    </p>
                </div>

                <div className="relative">
                    {/* Testimonial Cards */}
                    <div className="flex justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl">
                            {testimonials.slice(activeIndex, activeIndex + 2).map((testimonial) => (
                                <div
                                    key={testimonial.id}
                                    className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-500 hover:scale-105"
                                >
                                    <div className="flex items-center mb-6">
                                        <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {testimonial.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Verified Student
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className="w-5 h-5 text-yellow-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>

                                    <p className="text-gray-600 italic">"{testimonial.text}"</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Dots */}
                    <div className="flex justify-center mt-8 space-x-2">
                        {[...Array(Math.ceil(testimonials.length / 2))].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index * 2)}
                                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                                    Math.floor(activeIndex / 2) === index
                                        ? 'bg-blue-600'
                                        : 'bg-gray-300 hover:bg-blue-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
} 