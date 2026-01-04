import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, Target, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-profit/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        {/* Header */}
        <header className="relative z-10 container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-profit flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">TradeJournal</span>
            </div>
            <Button onClick={handleGetStarted} variant="outline">
              {user ? 'Dashboard' : 'Sign In'}
            </Button>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-16 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <span>Professional Forex Trading Journal</span>
              <ChevronRight className="w-4 h-4" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Track Every Trade.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-profit">
                Master Your Edge.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The most powerful trading journal for serious forex traders. 
              Log trades, analyze performance, and eliminate costly mistakes with data-driven insights.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Trade Better
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed for professional forex traders who want to improve their edge.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Trade Logging',
                description: 'Log every trade with detailed entry/exit data, setups, and psychology tags.',
                gradient: 'from-primary to-primary/60',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Visualize your equity curve, session performance, and strategy win rates.',
                gradient: 'from-profit to-profit/60',
              },
              {
                icon: Target,
                title: 'Mistake Filter',
                description: 'See what your results would look like without FOMO or rule-breaking trades.',
                gradient: 'from-badge-eur to-badge-eur/60',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your trading data is encrypted and only accessible by you.',
                gradient: 'from-badge-gbp to-badge-gbp/60',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 'Win Rate', label: 'Track your edge' },
              { value: 'Expectancy', label: 'Per trade value' },
              { value: 'R-Multiple', label: 'Risk management' },
              { value: 'Sessions', label: 'Time analysis' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-profit/10">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Improve Your Trading?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join traders who are serious about improving their edge through data-driven analysis.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gap-2 bg-gradient-to-r from-primary to-profit hover:opacity-90"
            >
              Start Journaling Today
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-profit flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">TradeJournal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TradeJournal. Built for serious traders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
