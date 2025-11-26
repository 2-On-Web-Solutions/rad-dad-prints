'use client';

import ServicesSettings from './ServicesSettings';
import ReviewsSettings from './ReviewsSettings';
import SocialLinksSettings from './SocialLinksSettings';
import LegalSettings from './LegalSettings';
import ChatbotSettings from './ChatbotSettings';
import TaglineSettings from './TaglineSettings';
import HeroMediaSettings from './HeroMediaSettings';
import ThemeSettings from './ThemeSettings';

export default function SettingsShell() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Settings & Site Controls</h1>
          <p className="opacity-70 max-w-[60ch] text-sm">
            Tweak your storefront content, branding, chatbot, and theme without touching code.
          </p>
        </div>

        <div className="text-xs md:text-right opacity-60">
          <div>Rad Dad Prints • Owner controls</div>
          <div>Changes sync to the public site in real time.</div>
        </div>
      </header>

      {/* Grid of cards (Overview-style) */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ServicesSettings />
        <ReviewsSettings />
        <SocialLinksSettings />
        <LegalSettings />
        <ChatbotSettings />
        <TaglineSettings />
        <HeroMediaSettings />
        <ThemeSettings />
      </div>
    </div>
  );
}