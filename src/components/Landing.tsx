import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Sparkles, BookOpen, Wand2, ChevronRight, Star, FileText, Image as ImageIcon, Zap, Globe, Users, Trophy, ArrowRight, Check, Feather, Palette, Library } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingProps {
  globalSettings?: any;
}

export default function Landing({ globalSettings }: LandingProps) {
  const appName = globalSettings?.appName || 'StoryCraft';
  const appIcon = globalSettings?.appIcon || '';
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-gold selection:text-night overflow-x-hidden">
      <div className="atmosphere" />

      {/* Navigation */}
      <nav className="px-6 md:px-12 py-5 flex items-center justify-between sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center text-night group-hover:scale-110 transition-transform overflow-hidden shadow-lg shadow-gold/20">
            {appIcon?.startsWith('http') ? (
              <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : appIcon ? (
              <span className="text-base">{appIcon}</span>
            ) : (
              <Sparkles size={18} />
            )}
          </div>
          <span className="font-serif text-xl tracking-tight font-bold">{appName}</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/35 hover:text-white/80 transition-colors">Features</a>
          <a href="#how-it-works" className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/35 hover:text-white/80 transition-colors">How It Works</a>
          <a href="#pricing" className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/35 hover:text-white/80 transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden md:block px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Sign In</Link>
          <Link to="/login" className="px-6 py-2.5 btn-gradient-gold rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/25 hover:scale-105 transition-transform">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-40 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[800px] h-[800px] -translate-x-1/3 -translate-y-1/3 rounded-full" style={{background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)'}} />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] translate-x-1/3 translate-y-1/3 rounded-full" style={{background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 65%)'}} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '80px 80px'}} />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="inline-flex items-center gap-3 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-8"
              >
                <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">{appName} · Creative Studio</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="text-[11vw] sm:text-[8vw] lg:text-[6.5vw] font-serif font-light leading-[0.88] mb-8 tracking-tighter"
              >
                Craft Your <br />
                <span className="italic text-gradient-gold">Masterpiece</span> <br />
                <span className="font-bold">Page by Page.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-lg text-white/40 font-light leading-relaxed max-w-lg mb-10"
              >
                The world's most immersive story studio. Write, illustrate, and publish your books with cinematic precision — powered by AI or your own imagination.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/login" className="px-10 py-5 btn-gradient-gold rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-gold/30 group">
                  <Wand2 size={20} />
                  <span>Start Crafting Free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/marketplace" className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                  <BookOpen size={20} />
                  <span>Browse Stories</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-8 mt-12 pt-8 border-t border-white/5"
              >
                {[
                  { val: '10k+', label: 'Books Crafted' },
                  { val: '50+', label: 'Art Styles' },
                  { val: '4.9★', label: 'User Rating' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-serif font-bold text-gold">{s.val}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              className="hidden lg:block relative"
            >
              {/* Main card */}
              <div className="relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-[2.5rem] p-1 shadow-2xl backdrop-blur-md">
                <div className="bg-night rounded-[2.2rem] overflow-hidden">
                  {/* Fake browser bar */}
                  <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/40" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                      <div className="w-3 h-3 rounded-full bg-green-500/40" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg px-4 py-1.5 text-[10px] text-white/20 font-mono">storycraft.app/studio</div>
                  </div>

                  {/* Fake story editor */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center">
                        <Feather size={14} className="text-night" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">The Obsidian Citadel</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-widest">Chapter 1 · 5 Pages</div>
                      </div>
                      <div className="ml-auto px-3 py-1 bg-gold/20 text-gold text-[9px] font-bold uppercase tracking-widest rounded-full border border-gold/20">Draft</div>
                    </div>

                    {/* Page preview */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-[#1a1008] to-[#0d0d0d] rounded-2xl flex items-center justify-center relative overflow-hidden border border-white/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center px-8">
                          <div className="text-2xl font-serif italic text-gold/80 mb-4 leading-tight">"Beyond the iron gates lay a world of forgotten magic..."</div>
                          <div className="w-12 h-[1px] bg-gold/30 mx-auto" />
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <ImageIcon size={14} className="text-gold/60" />
                      </div>
                    </div>

                    {/* AI controls */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: <Wand2 size={12} />, label: 'AI Script', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                        { icon: <ImageIcon size={12} />, label: 'AI Image', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
                        { icon: <Zap size={12} />, label: 'AI Enhance', color: 'text-gold bg-gold/10 border-gold/20' },
                      ].map(btn => (
                        <button key={btn.label} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${btn.color}`}>
                          {btn.icon} {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge 1 */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 bg-gold text-night px-4 py-2 rounded-2xl shadow-xl shadow-gold/30 flex items-center gap-2"
              >
                <Sparkles size={14} />
                <span className="text-xs font-bold">AI-Powered</span>
              </motion.div>

              {/* Floating badge 2 */}
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-white/10 border border-white/10 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2"
              >
                <div className="flex -space-x-1">
                  {['A','B','C'].map(l => (
                    <div key={l} className="w-5 h-5 rounded-full bg-gold/40 border border-night text-[8px] font-bold flex items-center justify-center">{l}</div>
                  ))}
                </div>
                <span className="text-[11px] font-medium">+2,400 creators</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="border-y border-white/5 bg-white/[0.015] py-4 overflow-hidden">
        <div className="flex animate-[ticker_20s_linear_infinite] whitespace-nowrap gap-16">
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-16 flex-shrink-0">
              {['Manual Editing', 'AI Script Generation', 'AI Illustrations', 'Photo Library', 'Dark Mode', '50+ Art Styles', 'Collaboration', 'Marketplace', 'Series Support'].map(item => (
                <span key={item} className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/15 flex items-center gap-4">
                  <span className="w-1 h-1 rounded-full bg-gold/40" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-40 relative z-10">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold mb-4 block">Why StoryCraft</span>
              <h2 className="text-6xl md:text-7xl font-serif font-light leading-tight tracking-tighter">Crafted for <span className="italic text-gradient-gold">Storytellers</span></h2>
              <p className="text-white/30 mt-4 text-sm max-w-xl mx-auto leading-relaxed">Everything you need to bring your stories to life — from idea to published masterpiece.</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText size={28} />,
                title: 'Rich Text Editor',
                desc: 'Full control over every word. Style your manuscript with fonts, sizes, and colors exactly as you envision.',
                num: '01',
              },
              {
                icon: <ImageIcon size={28} />,
                title: 'AI Illustrations',
                desc: 'Generate stunning page illustrations with AI, or upload your own photos and artwork.',
                num: '02',
              },
              {
                icon: <BookOpen size={28} />,
                title: 'Book Experience',
                desc: 'Read and create in a beautiful two-page spread that mimics the feel of a physical book.',
                num: '03',
              },
              {
                icon: <Palette size={28} />,
                title: '50+ Art Styles',
                desc: 'From watercolor dreams to cyberpunk noir — choose the perfect visual style for your story.',
                num: '04',
              },
              {
                icon: <Users size={28} />,
                title: 'Collaboration',
                desc: 'Invite co-authors to craft stories together in real time. The best tales are co-authored.',
                num: '05',
              },
              {
                icon: <Globe size={28} />,
                title: 'Multi-Language',
                desc: 'Write in English, Arabic, Japanese, French, and more. Tell stories in any language.',
                num: '06',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-8 bg-white/[0.03] border border-white/[0.06] hover:border-gold/20 rounded-[2rem] transition-all group relative overflow-hidden cursor-default card-hover-lift"
              >
                {/* Hover glow top */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/0 to-transparent group-hover:via-gold/50 transition-all duration-500 rounded-t-[2rem]" />

                {/* Number watermark */}
                <div className="absolute top-4 right-6 text-[6rem] font-serif font-bold leading-none text-white/[0.04] group-hover:text-gold/[0.07] transition-colors select-none">
                  {feature.num}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-gold/70 group-hover:bg-gold group-hover:text-night group-hover:border-gold transition-all duration-300 shadow-sm">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-serif font-bold mb-3 group-hover:text-gold transition-colors">{feature.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-40 bg-white/[0.015] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full" style={{background: 'radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)'}} />
        </div>
        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <div className="mb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold mb-4 block">The Process</span>
              <h2 className="text-6xl md:text-7xl font-serif font-light leading-tight tracking-tighter">Three <span className="italic text-gradient-gold">Simple</span> Steps</h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-[1px] bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20" />

            {[
              { step: '01', icon: <Feather size={28} />, title: 'Choose Your Format', desc: 'Pick from Stories, Comics, Novels, Manga, or Biographies. Select your art style and language.' },
              { step: '02', icon: <Wand2 size={28} />, title: 'Craft with AI or Manually', desc: 'Generate with AI in seconds, or write each page yourself. Upload your own images or generate them.' },
              { step: '03', icon: <Library size={28} />, title: 'Publish & Share', desc: 'Publish to the marketplace, share with friends, or keep it private in your personal library.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative group"
              >
                <div className="w-24 h-24 bg-white/5 border border-white/10 group-hover:border-gold/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gold/70 group-hover:bg-gold/10 transition-all duration-300 relative">
                  {step.icon}
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-gold rounded-full flex items-center justify-center text-[10px] font-bold text-night shadow-lg shadow-gold/30">{step.step}</div>
                </div>
                <h3 className="text-xl font-serif font-bold mb-3">{step.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: '10,000+', label: 'Books Crafted', icon: <BookOpen size={18} /> },
              { val: '50+', label: 'Custom Styles', icon: <Palette size={18} /> },
              { val: '4.9', label: 'User Rating', icon: <Star size={18} /> },
              { val: '6', label: 'Languages', icon: <Globe size={18} /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] hover:border-gold/20 transition-all group"
              >
                <div className="flex items-center justify-center gap-2 mb-3 text-gold/40 group-hover:text-gold transition-colors">
                  {stat.icon}
                </div>
                <span className="text-5xl font-serif font-bold text-gold block mb-2">{stat.val}</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing hint */}
      <section id="pricing" className="py-40 px-6 bg-white/[0.01] relative overflow-hidden">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold mb-4 block">Pricing</span>
            <h2 className="text-6xl font-serif font-light tracking-tighter">Simple, <span className="italic text-gradient-gold">Transparent</span> Pricing</h2>
            <p className="text-white/30 mt-4 text-sm max-w-md mx-auto">Start free, upgrade when you need more. Every plan includes the core story studio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Free', price: '$0', tokens: '5 tokens/mo', features: ['1 story total', '5 pages per story', '3 art styles', 'Manual editing'], cta: 'Get Started', highlight: false },
              { name: 'Standard', price: '$7', tokens: '20 tokens/mo', features: ['3 stories/month', '15 pages per story', 'AI generation', 'Collaboration'], cta: 'Start Standard', highlight: false },
              { name: 'Premium', price: '$20', tokens: '100 tokens/mo', features: ['Unlimited stories', '50 pages per story', 'All art styles', 'Marketplace publishing'], cta: 'Go Premium', highlight: true },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-[2rem] border relative ${plan.highlight ? 'bg-gold/10 border-gold/30 shadow-2xl shadow-gold/10' : 'bg-white/[0.03] border-white/[0.06]'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-night px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-gold/30">Most Popular</div>
                )}
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">{plan.name}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-serif font-bold ${plan.highlight ? 'text-gold' : 'text-white'}`}>{plan.price}</span>
                    <span className="text-white/30 text-sm">/mo</span>
                  </div>
                  <span className="text-[10px] text-gold/60 font-bold uppercase tracking-wider">{plan.tokens}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/50">
                      <Check size={14} className="text-gold flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${plan.highlight ? 'bg-gold text-night hover:bg-gold/90 shadow-lg shadow-gold/20' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 65%)'}} />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/[0.03] border border-gold/15 rounded-[3rem] p-16 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="text-gold fill-gold" />
                ))}
              </div>
            </div>
            <blockquote className="text-2xl font-serif font-light italic text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
              "The only limit is your imagination. Every crafted story is a universe waiting to be born."
            </blockquote>
            <h2 className="text-5xl md:text-6xl font-serif font-light mb-10 leading-tight text-glow">
              Ready to Craft Your <span className="italic text-gradient-gold">Masterpiece?</span>
            </h2>
            <Link to="/login" className="px-14 py-6 btn-gradient-gold rounded-[1.5rem] font-bold text-xl hover:scale-105 transition-transform shadow-2xl shadow-gold/40 inline-flex items-center gap-4 group">
              <span>Start for Free</span>
              <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <p className="text-[10px] text-white/15 mt-6 uppercase tracking-widest">No credit card required · 5 free tokens on signup</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/[0.04] px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center text-night overflow-hidden">
                {appIcon?.startsWith('http') ? (
                  <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : appIcon ? (
                  <span className="text-base">{appIcon}</span>
                ) : (
                  <Sparkles size={18} />
                )}
              </div>
              <span className="font-serif font-bold text-xl">{appName}</span>
            </div>

            <div className="flex items-center gap-10">
              {['Twitter', 'Discord', 'Instagram', 'GitHub'].map(social => (
                <a key={social} href="#" className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-gold transition-colors">{social}</a>
              ))}
            </div>

            <p className="text-[10px] small-caps tracking-[0.4em] text-white/10">&copy; 2026 {appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
