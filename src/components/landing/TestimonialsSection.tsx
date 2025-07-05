
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  business: string;
  location: string;
  content: string;
  avatar: string;
  rating: number;
  highlight: string;
}

const TestimonialsSection = () => {
  const testimonials: Testimonial[] = [
    {
      name: "Grace Mutua",
      business: "Mutua General Store",
      location: "Machakos",
      content: "DukaFiti transformed my shop completely. I used to forget who owed me money and how much stock I had. Now everything is organized and I've increased my profits by 40% in just 3 months!",
      avatar: "GM",
      rating: 5,
      highlight: "40% profit increase"
    },
    {
      name: "James Kiprotich",
      business: "Kiprotich Electronics",
      location: "Eldoret",
      content: "The M-Pesa integration is a game changer. My customers love that they can pay digitally, and I never miss a sale anymore. DukaFiti pays for itself within the first month.",
      avatar: "JK",
      rating: 5,
      highlight: "Zero missed sales"
    },
    {
      name: "Mary Wanjiru",
      business: "Mama Mary's Shop",
      location: "Nakuru",
      content: "I was skeptical about technology, but DukaFiti is so easy to use. Even my teenage daughter helps me with it. The customer debt tracking has saved me thousands of shillings.",
      avatar: "MW",
      rating: 5,
      highlight: "Easy to use"
    },
    {
      name: "Peter Mwangi",
      business: "Mwangi Wholesale",
      location: "Nairobi",
      content: "Running three shops was chaos before DukaFiti. Now I can monitor all locations from my phone and know exactly which products are selling best across all branches.",
      avatar: "PM",
      rating: 5,
      highlight: "Multi-store management"
    },
    {
      name: "Ruth Akinyi",
      business: "Akinyi Pharmacy",
      location: "Kisumu",
      content: "The low stock alerts are lifesavers! I never run out of essential medicines anymore. My customers trust me because I always have what they need when they need it.",
      avatar: "RA",
      rating: 5,
      highlight: "Never out of stock"
    },
    {
      name: "Samuel Kimani",
      business: "Kimani Hardware",
      location: "Thika",
      content: "DukaFiti's reports showed me which products actually make money. I stopped selling items that looked profitable but weren't. My actual profit doubled!",
      avatar: "SK",
      rating: 5,
      highlight: "Profit doubled"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-dukafiti-black to-dukafiti-black-soft" data-scroll-trigger>
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Real Success Stories from{' '}
            <span className="bg-gradient-to-r from-dukafiti-green to-dukafiti-purple bg-clip-text text-transparent">
              Kenyan Shop Owners
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Over 1,000 shop owners across Kenya have transformed their businesses with DukaFiti. Here's what they're saying:
          </p>
        </div>

        {/* Featured Testimonial */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card p-8 text-center border-dukafiti-green/30">
            <Quote className="w-12 h-12 text-dukafiti-green mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-medium text-white mb-6 leading-relaxed">
              "Before DukaFiti, I was just surviving. Now I'm actually growing my business and supporting my family better than ever."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-dukafiti-purple to-dukafiti-green rounded-full flex items-center justify-center text-white text-xl font-bold">
                GM
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-white">Grace Mutua</div>
                <div className="text-dukafiti-green">Mutua General Store, Machakos</div>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="glass-card p-6 hover:border-dukafiti-purple/50 transition-all duration-300 hover-scale"
              data-scroll-trigger
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-dukafiti-purple to-dukafiti-green rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-dukafiti-green">{testimonial.business}</div>
                    <div className="text-xs text-slate-400">{testimonial.location}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <blockquote className="text-slate-300 mb-4 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              <div className="bg-dukafiti-green/10 border border-dukafiti-green/30 rounded-lg p-3">
                <div className="text-dukafiti-green font-medium text-sm">
                  ✨ Key Result: {testimonial.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-dukafiti-green">1,000+</div>
                <div className="text-slate-300">Active Shops</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-dukafiti-green">500K+</div>
                <div className="text-slate-300">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-dukafiti-green">98%</div>
                <div className="text-slate-300">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-dukafiti-green">24/7</div>
                <div className="text-slate-300">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">
            Join These Successful Shop Owners
          </h3>
          <p className="text-slate-300 mb-6">
            Start your 14-day free trial and see the difference DukaFiti can make
          </p>
          <button className="cta-primary-dukafiti">
            Start Your Success Story Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
