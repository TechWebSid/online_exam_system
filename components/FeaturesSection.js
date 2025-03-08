'use client';

import { useEffect, useRef } from 'react';

const features = [
    {
        icon: '🛡️',
        title: 'AI-Powered Security',
        description: 'Face authentication before the exam starts',
    },
    {
        icon: '🔍',
        title: 'Anti-Cheating System',
        description: 'Eye-tracking, tab-switch detection, and copy-paste blocking',
    },
    {
        icon: '📝',
        title: 'Multiple Subjects & Exams',
        description: 'Different subjects, structured exams, and real-time results',
    },
    {
        icon: '⚡',
        title: 'Fast & Lightweight',
        description: 'Runs locally without internet, smooth and efficient performance',
    },
];

export function FeaturesSection() {
    const cardsRef = useRef([]);

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        cardsRef.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => {
            cardsRef.current.forEach((card) => {
                if (card) observer.unobserve(card);
            });
        };
    }, []);

    return (
        <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Why Choose Us?
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-gray-600">
                        Experience the next generation of online examination with our cutting-edge features
                    </p>
                </div>

                <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            ref={(el) => (cardsRef.current[index] = el)}
                            className="relative opacity-0 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
} 