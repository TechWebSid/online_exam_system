import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { ExamsSection } from '@/components/ExamsSection';
import { AntiCheatingSection } from '@/components/AntiCheatingSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { ContactSection } from '@/components/ContactSection';
import Chatbot from '@/components/Chatbot';


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
             <Chatbot/>
        </main>
    );
}
