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
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Navigation ── */}
      <nav className="px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{ background: 'var(--bg-primary)', backdropFilter: 'blur(16px) saturate(1.4)', borderBottom: '1px solid var(--border-light)', opacity: 0.97 }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
            {appIcon?.startsWith('http') ? (
              <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : appIcon ? (
              <span className="text-sm">{appIcon}</span>
            ) : (
              <Sparkles size={15} />
            )}
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{appName}</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Pricing'].map(label => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(' ', '-')}`}
              className="text-[13px] font-medium transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="btn btn-ghost btn-sm"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="btn btn-primary btn-sm"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 md:pt-32 pb-24 px-6 overflow-hidden min-h-[88vh] flex items-center">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[700px] h-[700px] -translate-x-1/3 -translate-y-1/3 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--accent-bg) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] translate-x-1/3 translate-y-1/3 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(77,124,86,0.04) 0%, transparent 65%)' }} />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-ring)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>AI-Powered Creative Studio</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(44px, 6vw, 68px)',
                  fontWeight: 300,
                  lineHeight: 1.0,
                  letterSpacing: '-0.025em',
                  color: 'var(--text-primary)',
                }}
              >
                Write stories<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>powered by AI.</em>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[16px] leading-relaxed max-w-[440px] mb-9 font-normal"
                style={{ color: 'var(--text-secondary)' }}
              >
                The creative studio for authors and storytellers. Write, illustrate, and publish books with AI or your own imagination.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  to="/login"
                  className="btn btn-primary btn-lg"
                >
                  <span>Start for free</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/marketplace"
                  className="btn btn-secondary btn-lg"
                >
                  <BookOpen size={16} />
                  <span>Browse stories</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-8 mt-10 pt-7"
                style={{ borderTop: '1px solid var(--border-light)' }}
              >
                {[
                  { val: '10k+', label: 'Books created' },
                  { val: '50+',  label: 'Art styles' },
                  { val: '4.9★', label: 'User rating' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-[20px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{s.val}</div>
                    <div className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: App preview mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="hidden lg:block relative"
            >
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}>
                {/* Window chrome */}
                <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                  </div>
                  <div className="flex-1 rounded-md px-3 py-1 text-[10px] font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                    app.storycraft.ai/studio
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                      <Feather size={13} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>The Obsidian Citadel</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Chapter 1 · 5 pages</div>
                    </div>
                    <div className="ml-auto px-2.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-ring)' }}>
                      Draft
                    </div>
                  </div>

                  <div className="aspect-[4/3] rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                    <div className="text-center px-8">
                      <p className="text-[15px] leading-relaxed italic font-light" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>
                        "Beyond the iron gates lay a world of forgotten magic..."
                      </p>
                      <div className="w-10 h-[1px] mx-auto mt-4" style={{ background: 'var(--border-strong)' }} />
                    </div>
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
                      <ImageIcon size={12} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <Wand2 size={11} />, label: 'AI Script', style: { color: '#7c3aed', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' } },
                      { icon: <ImageIcon size={11} />, label: 'AI Image', style: { color: '#2563eb', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' } },
                      { icon: <Zap size={11} />, label: 'Enhance', style: { color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-ring)' } },
                    ].map(btn => (
                      <button key={btn.label} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-wide transition-all" style={btn.style}>
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
                className="absolute -top-4 -right-4 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', boxShadow: 'var(--shadow-lg)' }}
              >
                <Sparkles size={13} />
                <span className="text-[11px] font-semibold">AI-Powered</span>
              </motion.div>

              <motion.div
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -left-4 px-3.5 py-1.5 rounded-xl flex items-center gap-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md)', color: 'var(--text-secondary)' }}
              >
                <div className="flex -space-x-1">
                  {['A', 'B', 'C'].map(l => (
                    <div key={l} className="w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--accent-bg)', border: '2px solid var(--bg-card)', color: 'var(--accent)' }}>{l}</div>
                  ))}
                </div>
                <span className="text-[11px] font-medium">+2,400 creators</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="py-3.5 overflow-hidden" style={{ borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
        <div className="flex animate-[ticker_22s_linear_infinite] whitespace-nowrap gap-14">
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-14 flex-shrink-0">
              {['Manual Editing', 'AI Script Generation', 'AI Illustrations', 'Photo Library', '50+ Art Styles', 'Collaboration', 'Marketplace', 'Series Support'].map(item => (
                <span key={item} className="text-[11px] font-semibold uppercase tracking-[0.3em] flex items-center gap-3.5" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'var(--accent-muted)' }} />
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
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="w-8 h-[1.5px]" style={{ background: 'var(--accent)' }} />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>Features</span>
              </div>
              <h2 className="mb-4" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 300, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Everything a storyteller needs
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
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
                className="p-6 rounded-2xl transition-all group cursor-default card-hover-lift"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-light)' }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--accent)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-on-accent)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                    }}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-[28px] font-bold leading-none select-none transition-colors"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--border-strong)' }}>
                    {feature.num}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-32 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-3 mb-4 justify-center">
                <span className="w-8 h-[1.5px]" style={{ background: 'var(--accent)' }} />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>The Process</span>
                <span className="w-8 h-[1.5px]" style={{ background: 'var(--accent)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 300, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Three simple steps
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.5%+2rem)] right-[calc(16.5%+2rem)] h-[1px]"
              style={{ background: `linear-gradient(to right, transparent, var(--accent-ring), transparent)` }} />

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
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 relative transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)', boxShadow: 'var(--shadow-sm)' }}>
                  {step.icon}
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md"
                    style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                    {step.step}
                  </div>
                </div>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-[13px] leading-relaxed max-w-[220px] mx-auto" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
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
                className="text-center p-6 rounded-2xl transition-all group card-hover-lift"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-3 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                  {stat.icon}
                </div>
                <span className="text-[36px] font-bold block mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{stat.val}</span>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-32 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 mb-4 justify-center">
              <span className="w-8 h-[1.5px]" style={{ background: 'var(--accent)' }} />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>Pricing</span>
              <span className="w-8 h-[1.5px]" style={{ background: 'var(--accent)' }} />
            </div>
            <h2 className="mb-3" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 300, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-[15px] max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>Start free, upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Hearth',   price: '$0',  sub: '/month', tokens: '5 tokens/mo',   features: ['1 story total', '5 pages per story', '3 art styles', 'Manual editing'], cta: 'Get started',    highlight: false },
              { name: 'Atelier',  price: '$18', sub: '/month', tokens: '60 tokens/mo',  features: ['10 stories/month', '30 pages per story', 'AI generation', 'Collaboration'], cta: 'Start Atelier', highlight: true },
              { name: 'Studio',   price: '$48', sub: '/month', tokens: '200 tokens/mo', features: ['Unlimited stories', '100 pages/story', 'All art styles', 'Marketplace publishing'], cta: 'Go Studio', highlight: false },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl relative flex flex-col"
                style={plan.highlight ? {
                  background: 'var(--bg-card)',
                  border: '2px solid var(--accent)',
                  boxShadow: `0 0 0 4px var(--accent-bg), var(--shadow-xl)`,
                } : {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <span className="text-[11px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'var(--text-tertiary)' }}>{plan.name}</span>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[40px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: plan.highlight ? 'var(--accent)' : 'var(--text-primary)' }}>{plan.price}</span>
                    <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{plan.sub}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-muted)' }}>{plan.tokens}</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <Check size={13} className="flex-shrink-0" style={{ color: 'var(--accent)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`w-full py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all ${plan.highlight ? 'btn-gradient-gold' : ''}`}
                  style={!plan.highlight ? {
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                  } : {}}
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
            className="rounded-3xl p-14"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="mx-0.5 fill-current" style={{ color: 'var(--accent)' }} />
              ))}
            </div>
            <h2 className="mb-4" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Ready to write your story?
            </h2>
            <p className="text-[15px] leading-relaxed mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of creators who use {appName} to bring their stories to life.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 font-semibold text-[15px] rounded-xl transition-all btn-gradient-gold group"
            >
              <span>Start for free</span>
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-[11px] mt-4" style={{ color: 'var(--text-tertiary)' }}>No credit card required · 5 free tokens on signup</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                {appIcon?.startsWith('http') ? (
                  <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : appIcon ? (
                  <span className="text-sm">{appIcon}</span>
                ) : (
                  <Sparkles size={13} />
                )}
              </div>
              <span className="font-semibold text-[14px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{appName}</span>
            </div>

            <div className="flex items-center gap-7">
              {['Twitter', 'Discord', 'GitHub'].map(social => (
                <a key={social} href="#" className="text-[12px] font-medium transition-colors" style={{ color: 'var(--text-tertiary)' }}>{social}</a>
              ))}
            </div>

            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>&copy; 2026 {appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
