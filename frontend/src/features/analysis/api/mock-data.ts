import type { AnalysisResults } from '../types';

export const MOCK_RESULTS: AnalysisResults = {
  score: 58,
  summary:
    'Analyzed PR diff across frontend files. Found 11 issues including accessibility violations in new components, color contrast problems in style changes, and cross-modal inconsistencies between markup and visual intent.',
  uiIssues: [
    {
      id: 'ui-1',
      severity: 'major',
      category: 'ui',
      title: 'Hardcoded color values in style changes',
      description:
        'The diff introduces hardcoded hex colors (#e5e7eb, #6b7280) instead of using design tokens or CSS variables. This makes theme consistency difficult to maintain.',
      location: 'styles/components.css:+14',
      suggestion: 'Use CSS custom properties or Tailwind theme colors instead of raw hex values.',
      fixCode: 'color: var(--color-muted); /* instead of #6b7280 */',
    },
    {
      id: 'ui-2',
      severity: 'critical',
      category: 'ui',
      title: 'Low contrast text introduced in diff',
      description:
        'New text style uses color #9ca3af on white background, yielding a contrast ratio of ~2.9:1, below the WCAG AA minimum of 4.5:1.',
      location: 'components/Card.tsx:+22',
      suggestion: 'Darken the text color to at least #6b7280 for 4.5:1 contrast ratio.',
      fixCode: '<p className="text-gray-500"> → <p className="text-gray-600">',
    },
    {
      id: 'ui-3',
      severity: 'minor',
      category: 'ui',
      title: 'Inconsistent spacing in new layout',
      description:
        'The PR adds gap-3 in one section but gap-4 in an adjacent section, creating visual inconsistency.',
      location: 'components/Layout.tsx:+8',
      suggestion: 'Use consistent spacing values across sibling containers.',
    },
  ],
  codeIssues: [
    {
      id: 'code-1',
      severity: 'major',
      category: 'code',
      title: 'Missing error boundary for new component',
      description:
        'The new AsyncDataPanel component fetches data but has no error handling. A network failure will crash the component tree.',
      location: 'components/AsyncDataPanel.tsx:+15',
      suggestion: 'Wrap with an error boundary or add try-catch to the data fetching logic.',
      fixCode:
        'const { data, error } = useSWR(url);\nif (error) return <ErrorFallback error={error} />;',
    },
    {
      id: 'code-2',
      severity: 'minor',
      category: 'code',
      title: 'Unused import added in diff',
      description: 'The diff adds an import for `useEffect` that is never used in the component.',
      location: 'components/Header.tsx:+1',
      suggestion: 'Remove the unused import.',
      fixCode: "import { useState } from 'react'; // remove useEffect",
    },
    {
      id: 'code-3',
      severity: 'major',
      category: 'code',
      title: 'Inline style overrides Tailwind classes',
      description:
        'The PR adds a style={{}} prop that conflicts with existing Tailwind classes, making the styling unpredictable.',
      location: 'components/Button.tsx:+9',
      suggestion: 'Use Tailwind classes exclusively or use cn() to merge conditional classes.',
    },
  ],
  crossModalIssues: [
    {
      id: 'xm-1',
      severity: 'critical',
      category: 'cross-modal',
      title: 'Button removed click handler but kept visual affordance',
      description:
        'The diff removes the onClick handler from a button but keeps cursor-pointer and hover styles. Users will see an interactive-looking element that does nothing.',
      location: 'components/ActionBar.tsx:+12',
      suggestion: 'Either restore the click handler or change the element to a non-interactive one.',
      fixCode:
        '<button onClick={handleAction} className="cursor-pointer hover:bg-primary/90">',
    },
    {
      id: 'xm-2',
      severity: 'major',
      category: 'cross-modal',
      title: 'Loading state added without visual feedback',
      description:
        'The diff adds isLoading state logic but the JSX does not conditionally render a spinner or skeleton. Users will see a blank area during loading.',
      location: 'components/DataGrid.tsx:+5,+18',
      suggestion:
        'Add a loading indicator that matches the component dimensions to prevent layout shift.',
      fixCode:
        'if (isLoading) return <Skeleton className="h-48 w-full" />;',
    },
  ],
  accessibilityIssues: [
    {
      id: 'a11y-1',
      severity: 'critical',
      category: 'accessibility',
      title: 'New image missing alt attribute (WCAG 1.1.1)',
      description:
        'The diff adds an <img> tag without an alt attribute. Screen readers cannot describe this image.',
      location: 'components/UserAvatar.tsx:+8',
      suggestion: 'Add descriptive alt text.',
      fixCode: '<img src={user.avatar} alt={`${user.name} profile photo`} />',
    },
    {
      id: 'a11y-2',
      severity: 'major',
      category: 'accessibility',
      title: 'Interactive div without keyboard support',
      description:
        'The diff adds onClick to a <div> element without tabIndex, role, or onKeyDown. This is not keyboard accessible.',
      location: 'components/Card.tsx:+30',
      suggestion:
        'Use a <button> element instead, or add role="button", tabIndex={0}, and onKeyDown handler.',
      fixCode:
        '<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={(e) => e.key === "Enter" && handleClick()}>',
    },
  ],
};
