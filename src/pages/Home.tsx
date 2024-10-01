import Hero from '@components/Hero';

export default function Home() {
  return (
    <div className="w-full px-56 lg:mt-16">
      <div className="relative w-full">
        <div id="radial_overlay" className="absolute inset-0 z-10" />
        <div className="relative z-20 flex h-[500px] w-full flex-col items-center justify-center">
          <Hero />
        </div>
      </div>
    </div>
  );
}
