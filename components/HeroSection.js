import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
    return (
        <section className="relative min-h-screen pt-16 overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-white">
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
                {/* Main content */}
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-8">
                        Your Gateway to{' '}
                        <span className="text-blue-600">Secure & Smart</span>
                        {' '}Online Exams
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600 mb-12">
                        AI-Powered Proctoring | Face Authentication | Anti-Cheating Features
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="#"
                            className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Start Exam Now
                        </Link>
                        <Link
                            href="#features"
                            className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Explore Features
                        </Link>
                    </div>
                </div>

                {/* Illustration */}
                <div className="mt-16 flow-root sm:mt-24">
                    <div className="relative -m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                        <Image
                            src="/hero-illustration.svg"
                            alt="Online Exam Platform Interface"
                            width={2432}
                            height={1442}
                            className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                            priority
                        />
                    </div>
                </div>
            </div>
        </section>
    );
} 