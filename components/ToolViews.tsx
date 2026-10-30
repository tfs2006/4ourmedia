import React, { Suspense } from 'react';
import type { AuthUser } from '../services/supabase';
import {
  PageLoader,
  UploadAuditorPage,
  TitleTrackerPage,
  HookLibraryPage,
  ThumbnailCheckerPage,
} from '../lib/appShared';

export type ToolView = 'upload-auditor' | 'title-tracker' | 'hook-library' | 'thumbnail-checker';

interface ToolViewsProps {
  view: ToolView;
  onBack: () => void;
  onOpenTool: (view: string) => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

const LABELS: Record<ToolView, string> = {
  'upload-auditor': 'Loading Upload Auditor',
  'title-tracker': 'Loading Title Tracker',
  'hook-library': 'Loading Hook Library',
  'thumbnail-checker': 'Loading Thumbnail Checker',
};

const PAGES = {
  'upload-auditor': UploadAuditorPage,
  'title-tracker': TitleTrackerPage,
  'hook-library': HookLibraryPage,
  'thumbnail-checker': ThumbnailCheckerPage,
};

export default function ToolViews({ view, ...rest }: ToolViewsProps) {
  const Page = PAGES[view];
  return (
    <Suspense fallback={<PageLoader label={LABELS[view]} />}>
      <Page {...rest} />
    </Suspense>
  );
}
