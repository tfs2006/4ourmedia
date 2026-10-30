export type CourseBlock =
  | { type: 'p'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; text: string };

export interface CourseCrossSell {
  text: string;
  cta: string;
  href: string;
  internal?: boolean;
}

export interface CourseLesson {
  id: string;
  title: string;
  minutes: number;
  blurb: string;
  blocks: CourseBlock[];
  openLoop: string;
  crossSell?: CourseCrossSell;
  finalCtas?: CourseCrossSell[];
}

export const MUSE_JOIN_URL = 'https://muse.ai/join';
export const REFERRAL_CODE_1 = '2A7LKB';
export const REFERRAL_CODE_2 = '6RBZUQ';
export const SHORTS_PACK_URL = 'https://shorts-pack-david-j-woodburys-projects.vercel.app/';

export const COURSE_TITLE = 'Muse AI Quick-Start';
export const COURSE_TAGLINE =
  'Five short lessons. Go from curious to running your one-person business with an AI chief of staff. About 35 minutes total. Free forever.';
export const COURSE_THROUGHLINE =
  'One idea runs through all five lessons: you plus AI leverage lets you think bigger.';

export const LESSONS: CourseLesson[] = [
  {
    id: 'what-muse-is',
    title: 'What Muse Actually Is',
    minutes: 5,
    blurb: 'Not a chatbot. An AI chief of staff with its own computer.',
    blocks: [
      {
        type: 'p',
        text: 'Forget chatbots. A chatbot waits for your next message and answers it. Muse takes an outcome and goes and gets it done.',
      },
      {
        type: 'p',
        text: 'Muse is an AI assistant with its own computer. It can read your email, manage your calendar, research anything on the web, build websites and tools, and run scheduled work while you sleep. You describe the result you want. It figures out the steps.',
      },
      {
        type: 'list',
        items: [
          'Morning briefing: it reads your calendar and inbox and hands you the day in one page.',
          'Research: it reads ten sources and gives you the answer with links, not a wall of tabs.',
          'Building: it writes code, drafts scripts and emails, and makes tools, all from one message.',
          'Watching: it checks things on a schedule and flags what matters, like new video comments or your weekly analytics.',
        ],
      },
      {
        type: 'p',
        text: 'Here is the idea this whole course runs on: you plus AI leverage lets you think bigger. One person with Muse does the work of a small team. Not by working more hours. By directing outcomes instead of doing tasks.',
      },
      {
        type: 'callout',
        text: 'Think of it this way. Before: you are the worker. After: you are the director. Muse is the crew.',
      },
    ],
    openLoop:
      'In the next lesson you will set it up in about ten minutes. Do it right and there is a billion tokens waiting on the other side.',
  },
  {
    id: 'setup-tokens',
    title: 'Get Set Up and Claim Your Tokens',
    minutes: 6,
    blurb: 'Join, enter the code, and redeem your billion tokens before the 48-hour window closes.',
    blocks: [
      {
        type: 'p',
        text: 'Setup takes ten minutes. The tokens make learning free, so do this part carefully.',
      },
      {
        type: 'steps',
        items: [
          'Go to https://muse.ai/join and create your account.',
          'Enter referral code 2A7LKB when you join. Both you and the referrer get 1 billion tokens.',
          'A second code works the same way: 6RBZUQ.',
          'Within 48 hours of joining, open Settings and redeem your tokens. Miss the window and they are gone.',
          'Install the apps: iOS, Android, and the web app. Sign in everywhere so Muse is with you.',
        ],
      },
      {
        type: 'callout',
        text: 'The 48-hour redemption window is the step everyone misses. If you join today, set a reminder for tomorrow.',
      },
      {
        type: 'p',
        text: 'A billion tokens sounds abstract. In practice it means months of heavy daily use without thinking about cost. Learn freely now, while it is free.',
      },
    ],
    openLoop:
      'Right now your Muse is a blank slate. In lesson 3 you connect your world to it, and that is when it stops feeling like software and starts feeling like staff.',
    crossSell: {
      text: 'Joined with the code? Make sure your tokens are claimed.',
      cta: 'Open Muse',
      href: MUSE_JOIN_URL,
    },
  },
  {
    id: 'connect-world',
    title: 'Connect Your World',
    minutes: 7,
    blurb: 'Two connections turn Muse from a demo into a daily driver.',
    blocks: [
      {
        type: 'p',
        text: 'Muse with no connections is a smart stranger. Connect two accounts and it becomes staff: Gmail and Google Calendar. Those two unlock ninety percent of daily leverage.',
      },
      {
        type: 'steps',
        items: [
          'Connect Gmail. Start with read access and ask it to summarize, not send.',
          'Connect Google Calendar so it knows your day.',
          'Give it your first real task: "Give me a morning briefing. My calendar today, important unread email, anything that needs a reply."',
        ],
      },
      {
        type: 'p',
        text: 'What good delegation looks like: one clear message with the outcome you want. Then let it work. Check the result. Correct it once, and it remembers the correction.',
      },
      {
        type: 'list',
        items: [
          '"Summarize this thread in three bullets."',
          '"Find me a two-hour block for deep work this week."',
          '"Draft a reply to this email. Keep it short."',
        ],
      },
      {
        type: 'p',
        text: 'Start with read-only asks. Let it send or change things only after you trust its judgment on the small stuff.',
      },
    ],
    openLoop:
      'A briefing is useful, but you still asked for it. In lesson 4 you teach Muse your repeating work once, and it runs your playbook forever.',
    crossSell: {
      text: 'Built for creators: put your new delegation skills to work on your next video title.',
      cta: 'Try the Title Scorer',
      href: '/title-scorer',
      internal: true,
    },
  },
  {
    id: 'first-skill',
    title: 'Build Your First Skill',
    minutes: 7,
    blurb: 'Teach it once. It runs your playbook forever.',
    blocks: [
      {
        type: 'p',
        text: 'A skill is a reusable playbook. You describe how you do a repeating task, save it, and invoke it any time with one sentence.',
      },
      {
        type: 'p',
        text: 'Pick something you do every week. For creators, title scoring is perfect. You already know what makes a title work. Now write it down as instructions once.',
      },
      {
        type: 'steps',
        items: [
          'Pick the repeating task. Example: "Score my YouTube titles."',
          'Describe your standards in plain words: "Check length, curiosity gap, power words, and clarity. Score 0 to 100 and explain each part."',
          'Save it as a skill with a name you will remember.',
          'Use it: "Score this title: ..." Done. Your judgment, applied in seconds, every time.',
        ],
      },
      {
        type: 'p',
        text: 'Why this matters: a skill scales your standards. Every future task runs through the judgment you baked in once. That is leverage compounding.',
      },
    ],
    openLoop:
      'One skill on demand is useful. Skills running on a schedule are leverage. Lesson 5 puts the whole thing on autopilot.',
    crossSell: {
      text: 'See a finished skill in action: score a title, then audit the whole upload.',
      cta: 'Open the Upload Auditor',
      href: '/upload-auditor',
      internal: true,
    },
  },
  {
    id: 'autopilot',
    title: 'Put It on Autopilot',
    minutes: 8,
    blurb: 'Scheduled work. The one-person business. Thinking bigger.',
    blocks: [
      {
        type: 'p',
        text: 'This is where it stops being a tool and becomes an engine. Muse can run work on a schedule and check in without being asked.',
      },
      {
        type: 'list',
        items: [
          'Daily briefing, 7am. Your day, your inbox, your priorities. Waiting when you wake up.',
          'Weekly analytics pull. Top videos, traffic sources, what changed. Every Monday.',
          'Comment watch. New comments flagged with reply drafts, so you never miss a warm viewer.',
        ],
      },
      {
        type: 'p',
        text: 'Now zoom out. This is the one-person business: you set direction, Muse runs the engine. Topics researched. Titles scored. Uploads audited. Comments answered. Revenue checked. All while you make the next video.',
      },
      {
        type: 'p',
        text: 'Remember the idea from lesson 1: you plus AI leverage lets you think bigger. The question stops being "how do I get this done" and becomes "what should I build next." That is the whole game.',
      },
      {
        type: 'callout',
        text: 'The course ends here. The leverage does not.',
      },
      {
        type: 'p',
        text: 'Your next upload is where the engine earns its keep. Give it work to do:',
      },
    ],
    openLoop: '',
    finalCtas: [
      { text: 'A title that pulls, scored in seconds.', cta: 'Title Scorer', href: '/title-scorer', internal: true },
      { text: 'A pre-publish check that catches mistakes.', cta: 'Upload Auditor', href: '/upload-auditor', internal: true },
      { text: 'Hooks that stop the scroll.', cta: 'Hook Swipe File', href: '/hook-library', internal: true },
      { text: 'A thumbnail that survives the feed.', cta: 'Thumbnail Checker', href: '/thumbnail-checker', internal: true },
      {
        text: 'Or start with 30 days of content done for you.',
        cta: '30-Day Viral Shorts Pack ($9)',
        href: SHORTS_PACK_URL,
      },
    ],
  },
];
