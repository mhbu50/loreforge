import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Sparkles, BookOpen, Wand2, ArrowRight, Check, Feather, Palette, Library, FileText, Image as ImageIcon, Zap, Globe, Users, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingProps {
  globalSettings?: any;
}

export default function Landing({ globalSettings }: LandingProps) {
  const appName = globalSettings?.appName || 'StoryCraft';
  const appIcon = globalSettings?.appIcon || '';
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -40]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#ececec] overflow-x-hidden selection:bg-[#D97757]/30">

      {/* ── Navigation ── */}
      <nav className="px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#D97757] rounded-lg flex items-center justify-center text-white overflow-hidden flex-shrink-0">
            {appIcon?.startsWith('http') ? (
              <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : appIcon ? (
              <span className="text-sm">{appIcon}</span>
            ) : (
              <Sparkles size={15} />
            )}
          </div>
          <span className="font-semibold text-[15px] text-white tracking-tight">{appName}</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Pricing'].map(label => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(' ', '-')}`}
              className="text-[13px] text-white/45 hover:text-white/80 transition-colors font-medium"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden md:block px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white/90 hover:bg-white/[0.06] rounded-lg transition-all"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-[#D97757] hover:bg-[#C86A48] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-lg shadow-[#D97757]/20"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 md:pt-32 pb-24 px-6 overflow-hidden min-h-[88vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] -translate-x-1/3 -translate-y-1/3 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] translate-x-1/3 translate-y-1/3 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.04) 0%, transparent 65%)' }} />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left: Copy */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D97757]/10 border border-[#D97757]/20 rounded-full mb-7"
              >
                <span className="w-1.5 h-1.5 bg-[#D97757] rounded-full" />
                <span className="text-[11px] font-semibold text-[#D97757] tracking-wide">AI-Powered Creative Studio</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[52px] sm:text-[60px] lg:text-[68px] font-bold leading-[1.02] tracking-[-0.03em] mb-6 text-white"
              >
                Write stories<br />
                <span className="text-[#D97757]">powered by AI.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[16px] text-white/50 leading-relaxed max-w-[440px] mb-9 font-normal"
              >
                The creative studio for authors and storytellers. Write, illustrate, and publish books with AI or your own imagination.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-[#D97757] hover:bg-[#C86A48] text-white font-semibold rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-xl shadow-[#D97757]/25 transition-colors group"
                >
                  <span>Start for free</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/marketplace"
                  className="px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white/80 font-semibold rounded-xl text-[14px] flex items-center justify-center gap-2 transition-all"
                >
                  <BookOpen size={16} />
                  <span>Browse stories</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-6 mt-10 pt-7 border-t border-white/[0.06]"
              >
                {[
                  { val: '10k+', label: 'Books created' },
                  { val: '50+',  label: 'Art styles' },
                  { val: '4.9★', label: 'User rating' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-[18px] font-bold text-white">{s.val}</div>
                    <div className="text-[11px] text-white/30 mt-0.5 font-medium">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: App preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="hidden lg:block relative"
            >
              <div className="bg-[#212121] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5 bg-[#1e1e1e]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <div className="flex-1 bg-white/[0.04] rounded-md px-3 py-1 text-[10px] text-white/25 font-mono">
                    app.storycraft.ai/studio
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#D97757] flex items-center justify-center">
                      <Feather size={13} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-white">The Obsidian Citadel</div>
                      <div className="text-[10px] text-white/30">Chapter 1 · 5 pages</div>
                    </div>
                    <div className="ml-auto px-2.5 py-0.5 bg-[#D97757]/15 text-[#D97757] text-[9px] font-semibold rounded-full border border-[#D97757]/20">
                      Draft
                    </div>
                  </div>

                  <div className="aspect-[4/3] bg-[#1a1a1a] rounded-xl flex items-center justify-center relative overflow-hidden border border-white/[0.06]">
                    <div className="text-center px-8">
                      <p className="text-[15px] text-white/60 leading-relaxed italic font-light">
                        "Beyond the iron gates lay a world of forgotten magic..."
                      </p>
                      <div className="w-10 h-[1px] bg-white/15 mx-auto mt-4" />
                    </div>
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <ImageIcon size={12} className="text-white/30" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <Wand2 size={11} />, label: 'AI Script', color: 'text-purple-400 bg-purple-400/8 border-purple-400/15' },
                      { icon: <ImageIcon size={11} />, label: 'AI Image', color: 'text-blue-400 bg-blue-400/8 border-blue-400/15' },
                      { icon: <Zap size={11} />, label: 'Enhance', color: 'text-[#D97757] bg-[#D97757]/8 border-[#D97757]/15' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-wide border transition-all ${btn.color}`}
                      >
                        {btn.icon} {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-[#D97757] text-white px-3.5 py-1.5 rounded-xl shadow-xl shadow-[#D97757]/25 flex items-center gap-1.5"
              >
                <Sparkles size={13} />
                <span className="text-[11px] font-semibold">AI-Powered</span>
              </motion.div>

              <motion.div
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-[#212121] border border-white/[0.10] text-white/80 px-3.5 py-1.5 rounded-xl shadow-xl flex items-center gap-2"
              >
                <div className="flex -space-x-1">
                  {['A', 'B', 'C'].map(l => (
                    <div key={l} className="w-5 h-5 rounded-full bg-[#D97757]/30 border border-[#1a1a1a] text-[8px] font-bold flex items-center justify-center text-white">{l}</div>
                  ))}
                </div>
                <span className="text-[11px] font-medium">+2,400 creators</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="border-y border-white/[0.05] bg-white/[0.01] py-3.5 overflow-hidden">
        <div className="flex animate-[ticker_22s_linear_infinite] whitespace-nowrap gap-14">
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-14 flex-shrink-0">
              {['Manual Editing', 'AI Script Generation', 'AI Illustrations', 'Photo Library', '50+ Art Styles', 'Collaboration', 'Marketplace', 'Series Support'].map(item => (
                <span key={item} className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/15 flex items-center gap-3.5">
                  <span className="w-1 h-1 rounded-full bg-[#D97757]/40" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-20 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[11px] font-semibold text-[#D97757] tracking-widest uppercase mb-3 block">Features</span>
              <h2 className="text-[40px] font-bold leading-tight tracking-tight text-white mb-3">
                Everything a storyteller needs
              </h2>
              <p className="text-white/40 text-[15px] leading-relaxed">
                From first idea to published masterpiece — all the tools in one place.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <FileText size={20} />, title: 'Rich Text Editor', desc: 'Full control over every word. Style your manuscript exactly as you envision.', num: '01' },
              { icon: <ImageIcon size={20} />, title: 'AI Illustrations', desc: 'Generate stunning page illustrations with AI or upload your own artwork.', num: '02' },
              { icon: <BookOpen size={20} />, title: 'Book Experience', desc: 'Beautiful two-page spread that mimics the feel of a real book.', num: '03' },
              { icon: <Palette size={20} />, title: '50+ Art Styles', desc: 'Watercolor, cyberpunk, steampunk — choose the perfect style for your story.', num: '04' },
              { icon: <Users size={20} />, title: 'Collaboration', desc: 'Invite co-authors to craft stories together in real time.', num: '05' },
              { icon: <Globe size={20} />, title: 'Multi-Language', desc: 'Write in English, Arabic, Japanese, French, and more.', num: '06' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="p-6 bg-[#212121] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all group cursor-default card-hover-lift"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 bg-white/[0.05] border border-white/[0.08] rounded-xl flex items-center justify-center text-[#D97757] group-hover:bg-[#D97757] group-hover:text-white group-hover:border-[#D97757] transition-all duration-200">
                    {feature.icon}
                  </div>
                  <span className="text-[28px] font-bold text-white/[0.04] group-hover:text-[#D97757]/[0.08] transition-colors select-none leading-none">
                    {feature.num}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-32 px-6 bg-[#212121]">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[11px] font-semibold text-[#D97757] tracking-widest uppercase mb-3 block">The Process</span>
              <h2 className="text-[40px] font-bold leading-tight tracking-tight text-white">Three simple steps</h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.5%+2rem)] right-[calc(16.5%+2rem)] h-[1px] bg-gradient-to-r from-[#D97757]/20 via-[#D97757]/40 to-[#D97757]/20" />

            {[
              { step: '1', icon: <Feather size={22} />, title: 'Choose your format', desc: 'Pick Stories, Comics, Novels, or Manga. Select your art style and language.' },
              { step: '2', icon: <Wand2 size={22} />, title: 'Write with AI or manually', desc: 'Generate with AI in seconds, or craft each page yourself.' },
              { step: '3', icon: <Library size={22} />, title: 'Publish & share', desc: 'Share with friends, publish to the marketplace, or keep it private.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center relative group"
              >
                <div className="w-20 h-20 bg-[#1a1a1a] border border-white/[0.08] group-hover:border-[#D97757]/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white/40 group-hover:text-[#D97757] transition-all relative">
                  {step.icon}
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#D97757] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/35 text-[13px] leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '10,000+', label: 'Books Created',  icon: <BookOpen size={16} /> },
              { val: '50+',     label: 'Art Styles',     icon: <Palette  size={16} /> },
              { val: '4.9',     label: 'User Rating',    icon: <Star     size={16} /> },
              { val: '6',       label: 'Languages',      icon: <Globe    size={16} /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center p-6 bg-[#212121] border border-white/[0.06] hover:border-white/[0.10] rounded-2xl transition-all group"
              >
                <div className="flex items-center justify-center gap-1.5 mb-3 text-white/25 group-hover:text-[#D97757] transition-colors">
                  {stat.icon}
                </div>
                <span className="text-[36px] font-bold text-white block mb-1">{stat.val}</span>
                <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-32 px-6 bg-[#212121]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold text-[#D97757] tracking-widest uppercase mb-3 block">Pricing</span>
            <h2 className="text-[40px] font-bold leading-tight tracking-tight text-white mb-3">Simple, transparent pricing</h2>
            <p className="text-white/40 text-[15px] max-w-sm mx-auto">Start free, upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Free',     price: '$0',  sub: '/month', tokens: '5 tokens/mo',   features: ['1 story total', '5 pages per story', '3 art styles', 'Manual editing'], cta: 'Get started',    highlight: false },
              { name: 'Standard', price: '$7',  sub: '/month', tokens: '20 tokens/mo',  features: ['3 stories/month', '15 pages per story', 'AI generation', 'Collaboration'], cta: 'Start Standard', highlight: false },
              { name: 'Premium',  price: '$20', sub: '/month', tokens: '100 tokens/mo', features: ['Unlimited stories', '50 pages/story', 'All art styles', 'Marketplace publishing'], cta: 'Go Premium', highlight: true },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`p-6 rounded-2xl border relative flex flex-col ${
                  plan.highlight
                    ? 'bg-[#D97757]/[0.08] border-[#D97757]/25 shadow-xl shadow-[#D97757]/10'
                    : 'bg-[#1a1a1a] border-white/[0.07]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D97757] text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow-lg">
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest block mb-2">{plan.name}</span>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-[40px] font-bold ${plan.highlight ? 'text-[#D97757]' : 'text-white'}`}>{plan.price}</span>
                    <span className="text-white/30 text-[13px]">{plan.sub}</span>
                  </div>
                  <span className="text-[11px] text-[#D97757]/60 font-semibold">{plan.tokens}</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/50">
                      <Check size={13} className="text-[#D97757] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`w-full py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all ${
                    plan.highlight
                      ? 'bg-[#D97757] hover:bg-[#C86A48] text-white shadow-lg shadow-[#D97757]/20'
                      : 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white/70 hover:text-white'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#212121] border border-white/[0.08] rounded-3xl p-14 shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-[#D97757] fill-[#D97757] mx-0.5" />
              ))}
            </div>
            <h2 className="text-[38px] font-bold text-white leading-tight tracking-tight mb-4">
              Ready to write your story?
            </h2>
            <p className="text-white/40 text-[15px] leading-relaxed mb-8 max-w-md mx-auto">
              Join thousands of creators who use {appName} to bring their stories to life.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#D97757] hover:bg-[#C86A48] text-white font-semibold text-[15px] rounded-xl transition-colors shadow-2xl shadow-[#D97757]/30 group"
            >
              <span>Start for free</span>
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-[11px] text-white/20 mt-4">No credit card required · 5 free tokens on signup</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/[0.06] px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#D97757] rounded-lg flex items-center justify-center text-white overflow-hidden">
                {appIcon?.startsWith('http') ? (
                  <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : appIcon ? (
                  <span className="text-sm">{appIcon}</span>
                ) : (
                  <Sparkles size={13} />
                )}
              </div>
              <span className="font-semibold text-[14px] text-white">{appName}</span>
            </div>

            <div className="flex items-center gap-7">
              {['Twitter', 'Discord', 'GitHub'].map(social => (
                <a key={social} href="#" className="text-[12px] font-medium text-white/25 hover:text-white/60 transition-colors">{social}</a>
              ))}
            </div>

            <p className="text-[12px] text-white/20">&copy; 2026 {appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
