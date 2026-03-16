import { useState } from 'react';
import {
  Sparkles,
  GitPullRequest,
  ImageIcon,
  Eye,
  Code,
  GitCompareArrows,
  Shield,
  Zap,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  {
    icon: Eye,
    title: 'UI Visual Analysis',
    desc: 'Detects layout breaks, color contrast violations, and spacing inconsistencies from screenshots.',
    color: '#3b82f6',
  },
  {
    icon: Code,
    title: 'Code Structure Review',
    desc: 'Analyzes semantic HTML, ARIA attributes, CSS anti-patterns, and component architecture.',
    color: '#8b5cf6',
  },
  {
    icon: GitCompareArrows,
    title: 'Cross-Modal Reasoning',
    desc: 'The key differentiator — AI correlates visual findings with code to find hidden mismatches.',
    color: '#ec4899',
  },
  {
    icon: Shield,
    title: 'WCAG Compliance',
    desc: 'Checks against WCAG 2.1 AA/AAA standards with specific violation references and fix suggestions.',
    color: '#10b981',
  },
] as const;

const STATS = [
  { value: '11+', label: 'Issue Categories' },
  { value: '< 15s', label: 'Analysis Time' },
  { value: 'WCAG 2.1', label: 'Standards' },
  { value: '9', label: 'AWS Services' },
] as const;

const TESTIMONIALS = [
  {
    name: 'Sarah Kim',
    role: 'Frontend Lead',
    company: 'TechCorp',
    avatar: 'https://i.pravatar.cc/40?img=1',
    text: 'NovaLens caught a contrast ratio issue that our entire team missed during code review.',
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'Senior Developer',
    company: 'StartupXYZ',
    avatar: 'https://i.pravatar.cc/40?img=3',
    text: 'The cross-modal analysis is a game-changer. It finds bugs that exist between code and visuals.',
    rating: 5,
  },
  {
    name: 'Mina Lee',
    role: 'UX Engineer',
    company: 'DesignLab',
    avatar: 'https://i.pravatar.cc/40?img=5',
    text: 'We integrated NovaLens into our PR workflow. Accessibility issues dropped by 60%.',
    rating: 4,
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
}: (typeof FEATURES)[number]) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={() => console.log('feature clicked')}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-5"
        style={{ backgroundColor: color }}
      />
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
        {desc}
      </p>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <img
          src={testimonial.avatar}
          className="h-9 w-9 rounded-full"
        />
        <div>
          <p className="text-sm font-medium">{testimonial.name}</p>
          <p style={{ color: '#b0b0b0', fontSize: '11px' }}>
            {testimonial.role} at {testimonial.company}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        "{testimonial.text}"
      </p>
      <div className="mt-2 flex gap-0.5">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </div>
  );
}

export function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative text-center">
        <div
          className="absolute inset-0 -z-10 mx-auto h-64 w-3/4 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #ec4899, #3b82f6)',
          }}
        />

        <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1">
          <Zap className="h-3 w-3" />
          Powered by Amazon Bedrock + Nova 2 Lite
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI-Powered{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Visual Code Review
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
          Paste a GitHub PR link and upload a UI screenshot. NovaLens cross-analyzes
          both modalities to catch bugs that fall between code review and visual QA.
        </p>

        {/* CTA Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onGetStarted}
          >
            <GitPullRequest className="h-4 w-4" />
            Start Analysis
            <ArrowRight
              className={`h-4 w-4 transition-transform ${isHovered ? 'translate-x-0.5' : ''}`}
            />
          </div>
          <a
            href="https://github.com/buddypia/novalens"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            View on GitHub
          </a>
        </div>

        {/* How It Works Mini */}
        <div className="mx-auto mt-8 flex max-w-lg items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <GitPullRequest className="h-3.5 w-3.5" />
            Paste PR URL
          </div>
          <ArrowRight className="h-3 w-3" />
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Add Screenshot
          </div>
          <ArrowRight className="h-3 w-3" />
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Get AI Review
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 rounded-xl border bg-muted/30 p-4">
        {STATS.map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="space-y-4">
        <h2 className="text-center text-lg font-semibold">
          Trusted by Developers
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
