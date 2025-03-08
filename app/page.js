import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { ExamsSection } from '@/components/ExamsSection';
import { AntiCheatingSection } from '@/components/AntiCheatingSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { ContactSection } from '@/components/ContactSection';

export default function Home() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <ExamsSection />
            <AntiCheatingSection />
            <TestimonialsSection />
            <ContactSection />
        </main>
    );
}
