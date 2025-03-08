'use client';

const exams = [
    {
        id: 1,
        title: 'DBMS Exam',
        subtitle: 'Database Management System MCQs',
        icon: '📚',
        duration: '60 mins',
        difficulty: 'Intermediate',
        questions: 50,
    },
    {
        id: 2,
        title: 'Operating System Exam',
        subtitle: 'OS Concepts & Scheduling Questions',
        icon: '💻',
        duration: '45 mins',
        difficulty: 'Advanced',
        questions: 40,
    },
    {
        id: 3,
        title: 'Java Exam',
        subtitle: 'OOPs, Threads, and Core Java MCQs',
        icon: '📜',
        duration: '90 mins',
        difficulty: 'Expert',
        questions: 75,
    },
    {
        id: 4,
        title: 'Networking Exam',
        subtitle: 'TCP/IP, OSI Model, Protocols & Security',
        icon: '📡',
        duration: '60 mins',
        difficulty: 'Intermediate',
        questions: 60,
    },
];

export function ExamsSection() {
    return (
        <section id="exams" className="py-24 bg-gradient-to-br from-white via-blue-50 to-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                        Select an Exam & Test Your Knowledge!
                    </h2>
                    <p className="text-lg text-gray-600">
                        Choose from our wide range of carefully curated exams
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
                    {exams.map((exam) => (
                        <div
                            key={exam.id}
                            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-4xl">{exam.icon}</span>
                                    <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
                                        {exam.difficulty}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {exam.title}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {exam.subtitle}
                                </p>
                                
                                <div className="mt-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-4">⏱️ {exam.duration}</span>
                                        <span>❓ {exam.questions} Questions</span>
                                    </div>
                                </div>
                                
                                <button className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300">
                                    Start Exam
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
                        View All Exams
                        <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
} 