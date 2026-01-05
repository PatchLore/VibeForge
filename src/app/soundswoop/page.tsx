import Hero from '@/components/soundswoop/Hero';
import ProofStrip from '@/components/soundswoop/ProofStrip';
import GoldenSample from '@/components/soundswoop/GoldenSample';
import HowItWorks from '@/components/soundswoop/HowItWorks';
import Packages from '@/components/soundswoop/Packages';
import FAQ from '@/components/soundswoop/FAQ';
import FinalCTA from '@/components/soundswoop/FinalCTA';

export default function SoundSwoopPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />
      <ProofStrip />
      <GoldenSample />
      <HowItWorks />
      <Packages />
      <FAQ />
      <FinalCTA />
    </div>
  );
}
