
import { useState } from 'react';
import DemoTabs from './demo/DemoTabs';
import DemoContent from './demo/DemoContent';

const InteractiveDemoSection = () => {
  const [activeDemo, setActiveDemo] = useState('sales');

  return (
    <section id="demo" className="py-20 bg-slate-950" data-scroll-trigger>
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            See ShopSmart in{' '}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Experience how easy it is to manage your shop with our intuitive interface
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <DemoTabs activeDemo={activeDemo} onDemoChange={setActiveDemo} />
          <DemoContent activeDemo={activeDemo} />
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemoSection;
