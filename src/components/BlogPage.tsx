import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Clock,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  Sparkles,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Calculator,
  ShieldAlert,
  BarChart3,
  Layers,
  ChevronDown
} from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '../data/blogPosts';
import { FloordoneLogo } from './FloordoneLogo';

interface BlogPageProps {
  initialSlug?: string | null;
  onSelectPost?: (slug: string) => void;
  onOpenEditor: (templateId?: string) => void;
  onNavigateHome: () => void;
  onOpenPricing?: () => void;
  onOpenTemplates?: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  initialSlug,
  onSelectPost,
  onOpenEditor,
  onNavigateHome,
  onOpenPricing,
  onOpenTemplates
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Sync with initialSlug prop changes
  useEffect(() => {
    if (initialSlug !== undefined) {
      setSelectedSlug(initialSlug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialSlug]);

  const activePost = useMemo(() => {
    if (!selectedSlug) return null;
    return BLOG_POSTS.find((p) => p.slug === selectedSlug) || null;
  }, [selectedSlug]);

  // Dynamic SEO Title and Meta structured data injection
  useEffect(() => {
    if (activePost) {
      document.title = activePost.metaTitle;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', activePost.metaDescription);

      // JSON-LD Structured Data for BlogPosting + FAQPage
      const schemaScriptId = 'floordone-blog-schema';
      let scriptTag = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = schemaScriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const schemaData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            '@id': `https://floordone.com/blog/${activePost.slug}#article`,
            'headline': activePost.title,
            'description': activePost.metaDescription,
            'keywords': [activePost.primaryKeyword, ...activePost.secondaryKeywords].join(', '),
            'datePublished': activePost.publishedAt,
            'dateModified': activePost.updatedAt,
            'author': {
              '@type': 'Person',
              'name': activePost.author.name,
              'jobTitle': activePost.author.role
            },
            'publisher': {
              '@type': 'Organization',
              'name': 'Floordone',
              'logo': {
                '@type': 'ImageObject',
                'url': 'https://floordone.com/favicon.svg'
              }
            },
            'mainEntityOfPage': {
              '@type': 'WebPage',
              '@id': `https://floordone.com/blog/${activePost.slug}`
            }
          },
          {
            '@type': 'FAQPage',
            'mainEntity': activePost.faq.map((f) => ({
              '@type': 'Question',
              'name': f.question,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': f.answer
              }
            }))
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': 'https://floordone.com/'
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Blog',
                'item': 'https://floordone.com/?view=blogs'
              },
              {
                '@type': 'ListItem',
                'position': 3,
                'name': activePost.title,
                'item': `https://floordone.com/?view=blogs&slug=${activePost.slug}`
              }
            ]
          }
        ]
      };

      scriptTag.textContent = JSON.stringify(schemaData);
    } else {
      document.title = 'Hospitality Architecture & Floor Planning Blog | Floordone';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'Explore in-depth restaurant floor plan guides, seating capacity formulas, banquet table dimensions, 3D walkthroughs, and fire-code clearances.'
        );
      }
      const existingScript = document.getElementById('floordone-blog-schema');
      if (existingScript) {
        existingScript.remove();
      }
    }

    return () => {
      // Clean up schema on unmount if needed
      const tag = document.getElementById('floordone-blog-schema');
      if (tag) tag.remove();
    };
  }, [activePost]);

  const categories = ['All', 'Seating & Capacity', 'Event Planning', '3D Visualization', 'Compliance & Layout'];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCat = selectedCategory === 'All' || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;
      const matchesSearch =
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.primaryKeyword.toLowerCase().includes(q) ||
        post.secondaryKeywords.some((k) => k.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleOpenPost = (slug: string) => {
    setSelectedSlug(slug);
    if (onSelectPost) onSelectPost(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL query without reload
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'blogs');
    url.searchParams.set('slug', slug);
    window.history.pushState({}, '', url.toString());
  };

  const handleBackToList = () => {
    setSelectedSlug(null);
    if (onSelectPost) onSelectPost('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'blogs');
    url.searchParams.delete('slug');
    window.history.pushState({}, '', url.toString());
  };

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn('Copy link error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Breadcrumb & Back Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 hover:opacity-90 transition cursor-pointer"
              title="Return to Floordone Home"
            >
              <FloordoneLogo size="sm" showWordmark={true} />
            </button>
            <span className="text-slate-300">/</span>
            <button
              onClick={handleBackToList}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Resource Hub & Blog
            </button>
            {activePost && (
              <>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline truncate max-w-[200px] md:max-w-[320px]">
                  {activePost.title}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenEditor()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Launch Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {activePost ? (
          /* ========================================================================= */
          /* SINGLE POST DETAIL VIEW                                                  */
          /* ========================================================================= */
          <article className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition mb-6 cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to all guides</span>
            </button>

            {/* Article Header */}
            <div className="space-y-4 pb-8 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: activePost.categoryColor }}
                >
                  {activePost.category}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {activePost.coverBadge}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-medium ml-auto">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {activePost.readTime}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {activePost.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                {activePost.summary}
              </p>

              {/* Author & Share Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shadow-xs">
                    {activePost.author.avatar}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{activePost.author.name}</p>
                    <p className="text-slate-500 text-[11px]">{activePost.author.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Updated {activePost.publishedAt}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer shadow-2xs"
                    title="Copy direct article URL"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* In-Article Sticky / Interactive Banner */}
            <div className="my-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  Interactive Venue Designer
                </div>
                <h2 className="text-lg font-bold text-white">
                  Test this layout configuration live in 2D & 3D
                </h2>
                <p className="text-xs text-indigo-200 max-w-xl">
                  Simulate table clearances, verify aisle fire code widths, and preview human eye-level sightlines with zero install.
                </p>
              </div>
              <button
                onClick={() => onOpenEditor(activePost.recommendedTemplateId)}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs shadow-md transition hover:scale-105 shrink-0 cursor-pointer flex items-center gap-2"
              >
                <span>Launch Template Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Table of Contents Jump Box */}
            <nav aria-label="Table of contents" className="my-6 p-4 rounded-xl bg-slate-100 border border-slate-200">
              <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Table of Contents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activePost.tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </nav>

            {/* Article Body */}
            <div className="prose prose-slate max-w-none space-y-10 text-slate-800 leading-relaxed text-base pt-4">
              {/* Introduction */}
              <div className="text-lg text-slate-700 leading-relaxed border-l-4 border-indigo-500 pl-4 italic bg-indigo-50/40 py-2 rounded-r-lg">
                {activePost.content.intro}
              </div>

              {/* Sections */}
              {activePost.content.sections.map((section) => (
                <section key={section.id} id={section.id} className="space-y-4 pt-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {section.heading}
                  </h2>

                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-slate-700 leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {/* Highlight Box */}
                  {section.highlightBox && (
                    <div
                      className={`p-5 rounded-2xl border my-4 ${
                        section.highlightBox.type === 'formula'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                          : section.highlightBox.type === 'regulation'
                          ? 'bg-red-50/80 border-red-200 text-red-950'
                          : section.highlightBox.type === 'stat'
                          ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 font-black text-sm">
                        {section.highlightBox.type === 'formula' && <Calculator className="w-4 h-4 text-amber-600" />}
                        {section.highlightBox.type === 'regulation' && <ShieldAlert className="w-4 h-4 text-red-600" />}
                        {section.highlightBox.type === 'stat' && <BarChart3 className="w-4 h-4 text-blue-600" />}
                        {section.highlightBox.type === 'tip' && <Lightbulb className="w-4 h-4 text-emerald-600" />}
                        <span>{section.highlightBox.title}</span>
                      </div>
                      <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed font-medium">
                        {section.highlightBox.body}
                      </p>
                    </div>
                  )}

                  {/* Bullet Points */}
                  {section.bulletPoints && (
                    <ul className="space-y-2 pl-4 list-none my-3">
                      {section.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Table */}
                  {section.table && (
                    <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-xs bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            {section.table.headers.map((th, hIdx) => (
                              <th key={hIdx} className="px-4 py-3">
                                {th}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {section.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 transition">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-slate-800">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {section.table.caption && (
                        <p className="px-4 py-2 text-[11px] text-slate-400 bg-slate-50/50 border-t border-slate-100">
                          {section.table.caption}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              ))}

              {/* Key Takeaways Box */}
              <div className="mt-12 p-6 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-xs space-y-3">
                <h3 className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
                  <Check className="w-5 h-5 text-indigo-600" />
                  Key Takeaways for Venue Operators
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-indigo-900 font-medium">
                  {activePost.content.takeaways.map((item, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* FAQ Section */}
              {activePost.faq && activePost.faq.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-200 space-y-4">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-3">
                    {activePost.faq.map((faqItem, fIdx) => (
                      <div
                        key={fIdx}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === fIdx ? null : fIdx)}
                          className="w-full px-4 py-3.5 text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-indigo-600 flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <span>{faqItem.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                              openFaqIndex === fIdx ? 'rotate-180 text-indigo-600' : ''
                            }`}
                          />
                        </button>
                        {openFaqIndex === fIdx && (
                          <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-2 bg-slate-50/50">
                            {faqItem.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Read Next / Related Guides */}
            <div className="mt-16 pt-8 border-t border-slate-200 space-y-6">
              <h3 className="text-lg font-black text-slate-900">Related Floor Planning Guides</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BLOG_POSTS.filter((p) => p.slug !== activePost.slug)
                  .slice(0, 3)
                  .map((relPost) => (
                    <div
                      key={relPost.slug}
                      onClick={() => handleOpenPost(relPost.slug)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: relPost.categoryColor }}
                        >
                          {relPost.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                          {relPost.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{relPost.summary}</p>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-3">
                        Read Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </article>
        ) : (
          /* ========================================================================= */
          /* BLOG INDEX / DIRECTORY VIEW                                              */
          /* ========================================================================= */
          <div className="space-y-12">
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Floordone Architectural & Venue Knowledge Base
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Hospitality Floor Planning & Capacity Guides
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Authoritative architectural benchmarks, ADA aisle clearance regulations, seating capacity formulas, and 3D walkthrough insights for restaurants, banquet halls, and wedding venues.
              </p>

              {/* Search & Filter Bar */}
              <div className="pt-2 max-w-xl mx-auto flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search articles by keyword (e.g. capacity, banquet, aisle, 3d)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 cursor-pointer font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Article Card (if no search query active) */}
            {!searchQuery && selectedCategory === 'All' && (
              <div
                onClick={() => handleOpenPost(BLOG_POSTS[0].slug)}
                className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group relative overflow-hidden"
              >
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500 text-white text-[11px] font-extrabold uppercase tracking-wider">
                      Featured Masterclass
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {BLOG_POSTS[0].readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-white group-hover:text-indigo-300 transition tracking-tight">
                    {BLOG_POSTS[0].title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {BLOG_POSTS[0].summary}
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                        {BLOG_POSTS[0].author.avatar}
                      </span>
                      <span>By {BLOG_POSTS[0].author.name}</span>
                    </div>

                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 ml-auto">
                      Read Complete Guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">
                  {selectedCategory === 'All' ? 'All Published Guides' : `${selectedCategory} Guides`}
                  <span className="text-xs font-medium text-slate-400 ml-2">
                    ({filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'})
                  </span>
                </h2>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                  <p className="text-slate-500 font-bold text-sm">No articles matched your search.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-3 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Reset search filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.slug}
                      onClick={() => handleOpenPost(post.slug)}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white"
                            style={{ backgroundColor: post.categoryColor }}
                          >
                            {post.category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
                          {post.summary}
                        </p>
                      </div>

                      <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{post.author.avatar}</span>
                          <span className="font-semibold text-slate-700 text-[11px]">{post.author.name}</span>
                        </div>

                        <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-4">
              <span className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 inline-flex items-center justify-center text-indigo-600 shadow-2xs">
                <Layers className="w-6 h-6 text-indigo-600" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Ready to Design Your Floor Plan in 3D?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                No CAD experience needed. Pick a template, arrange tables with live cover counting, calculate clearances, and share 3D walkthroughs with your team.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onOpenEditor()}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition hover:scale-105 cursor-pointer flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Start Designing Free</span>
                </button>
                {onOpenTemplates && (
                  <button
                    onClick={onOpenTemplates}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Browse Templates
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FloordoneLogo size="xs" showWordmark={true} />
            <span className="text-slate-400 pl-2 border-l border-slate-200">
              © {new Date().getFullYear()} Floordone Inc.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateHome}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={handleBackToList}
              className="hover:text-slate-900 transition cursor-pointer font-bold text-indigo-600"
            >
              Blog
            </button>
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="hover:text-slate-900 transition cursor-pointer"
              >
                Pricing
              </button>
            )}
            <button
              onClick={() => onOpenEditor()}
              className="hover:text-indigo-600 transition font-bold cursor-pointer"
            >
              Open Studio →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
