'use client';

import { useEffect, useRef } from 'react';

const features = [
    {
        icon: '👁️',
        title: 'Face Authentication',
        description: 'Verify your identity before starting the exam',
        animation: 'animate-pulse',
    },
    {
        icon: '📷',
        title: 'Eye-Tracking AI',
        description: 'Detects suspicious eye movements',
        animation: 'animate-bounce',
    },
    {
        icon: '⚠️',
        title: 'Tab-Switch Warning',
        description: 'Switching tabs will issue warnings & auto-submit exam',
        animation: 'animate-ping',
    },
    {
        icon: '🚫',
        title: 'Copy-Paste Disabled',
        description: 'No cheating with blocked shortcuts & right-click',
        animation: 'animate-spin',
    },
];

export function AntiCheatingSection() {
    const featuresRef = useRef([]);

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

        featuresRef.current.forEach((feature) => {
            if (feature) observer.observe(feature);
        });

        return () => {
            featuresRef.current.forEach((feature) => {
                if (feature) observer.unobserve(feature);
            });
        };
    }, []);

    return (
        <section id="anti-cheating" className="py-24 relative overflow-hidden bg-gradient-to-b from-gray-900 to-blue-900">
            {/* Geometric Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(30deg,#0000_33%,#ffffff08_40%,#ffffff0b_50%,#ffffff08_60%,#0000_67%)] bg-[length:60px_60px]" />
                <div className="absolute inset-0 bg-[linear-gradient(150deg,#0000_33%,#ffffff08_40%,#ffffff0b_50%,#ffffff08_60%,#0000_67%)] bg-[length:60px_60px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                        Smart AI Monitoring – Ensuring a Fair Exam
                    </h2>
                    <p className="text-lg text-gray-300">
                        Our cutting-edge AI technology ensures exam integrity
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            ref={(el) => (featuresRef.current[index] = el)}
                            className="relative opacity-0 group bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all duration-300"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`text-4xl ${feature.animation}`}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-300 group-hover:text-white transition-colors duration-300">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Hover Effect */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-xl transition-all duration-300" />
                        </div>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="mt-16 text-center">
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Our AI-powered proctoring system ensures a fair examination environment while maintaining privacy and security.
                    </p>
                    <button className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors duration-300">
                        Learn More About Security
                    </button>
                </div>
            </div>
        </section>
    );
} 