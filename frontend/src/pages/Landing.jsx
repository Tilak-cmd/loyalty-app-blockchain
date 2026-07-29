import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import Logo from "../components/Logo";
import {
  ArrowRight, Sparkles, Shield, Gift, Store, Coins, Repeat,
  CheckCircle, Menu, X, Star, Globe, Wallet,
} from "lucide-react";

const features = [
  { icon: Coins, title: "Earn Everywhere", desc: "Get rewarded at every purchase across partnered merchants", gradient: "from-brand-500 to-brand-600" },
  { icon: Gift, title: "Redeem Instantly", desc: "Swap points for real rewards with one click — no waiting", gradient: "from-emerald-500 to-emerald-600" },
  { icon: Shield, title: "Backed by Blockchain", desc: "Your rewards are verifiable, transparent, and always yours", gradient: "from-blue-500 to-indigo-600" },
  { icon: Repeat, title: "Cross-Merchant Network", desc: "Use points earned at one store at any merchant in the network", gradient: "from-purple-500 to-pink-600" },
  { icon: Globe, title: "Simple Sign-In", desc: "Just your email — no crypto wallet or gas fees to worry about", gradient: "from-cyan-500 to-blue-600" },
  { icon: Wallet, title: "Multi-Merchant Wallet", desc: "All your loyalty points in one place. One wallet for every brand", gradient: "from-amber-500 to-orange-600" },
];

const stats = [
  { label: "Active Merchants", value: "500+" },
  { label: "Points Issued", value: "10M+" },
  { label: "Active Customers", value: "50K+" },
  { label: "Avg. Redemption Rate", value: "87%" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">How It Works</a>
            <a href="#stats" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Stats</a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate("/dashboard")}>
                Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => navigate("/customer/auth")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/merchant/login")}>
                  For Merchants <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-border-primary p-4 space-y-3 animate-slide-down">
            <a href="#features" className="block text-sm py-2" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm py-2" onClick={() => setMobileMenu(false)}>How It Works</a>
            <a href="#stats" className="block text-sm py-2" onClick={() => setMobileMenu(false)}>Stats</a>
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => { setMobileMenu(false); navigate("/dashboard"); }} block>Dashboard</Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => { setMobileMenu(false); navigate("/customer/auth"); }} block>Sign In</Button>
                  <Button onClick={() => { setMobileMenu(false); navigate("/merchant/login"); }} block>For Merchants <ArrowRight className="w-4 h-4" /></Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-sm font-medium text-brand-700">Blockchain-powered loyalty, simplified</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Earn rewards everywhere.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">Redeem anywhere.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            The universal loyalty platform that connects merchants and customers.
            Earn points, redeem rewards, and grow your business — all powered by blockchain,
            all accessible with just your email.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {user ? (
              <Button size="xl" onClick={() => navigate("/dashboard")}>
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button size="xl" onClick={() => navigate("/customer/auth")}>
                  Start Earning <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="xl" onClick={() => navigate("/merchant/login")}>
                  I'm a Merchant
                </Button>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-text-tertiary">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No crypto needed</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Email login</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Instant rewards</span>
          </div>
        </div>
      </section>

      <section id="stats" className="border-y border-border-primary bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-text-primary">{s.value}</p>
                <p className="text-sm text-text-tertiary mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">Everything you need</h2>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            A complete loyalty platform for merchants and customers — no blockchain experience required.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group relative bg-surface rounded-2xl border border-border-primary p-6 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                f.gradient,
              )}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-tertiary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-surface-secondary border-y border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">How it works</h2>
            <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              Three simple steps to start earning and redeeming loyalty rewards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Sign Up", desc: "Create your account with just your email. No wallet, no crypto, no gas fees." },
              { step: "02", title: "Earn Points", desc: "Shop at any partnered merchant and earn points automatically." },
              { step: "03", title: "Redeem Rewards", desc: "Swap your points for real products and rewards across the network." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl font-bold text-brand-600">{item.step}</span>
                </div>
                <h3 className="font-semibold text-text-primary mb-1.5">{item.title}</h3>
                <p className="text-sm text-text-tertiary leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-8 py-16 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <Badge variant="premium" size="lg" className="mb-6">Get Started Free</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to transform your loyalty program?
            </h2>
            <p className="text-lg text-brand-200 max-w-lg mx-auto mb-8">
              Join hundreds of merchants and thousands of customers already on Namchepoints.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {user ? (
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50" onClick={() => navigate("/merchant/login")}>
                    Start as Merchant <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="lg" className="bg-brand-500 text-white border-brand-400 hover:bg-brand-400" onClick={() => navigate("/customer/auth")}>
                    Start as Customer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" />
            </div>
            <p className="text-sm text-text-tertiary">
              Namchepoints — Loyalty Rewards Platform.
            </p>
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
