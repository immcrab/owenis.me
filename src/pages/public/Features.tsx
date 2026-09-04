import {
  Bot,
  Cloud,
  Globe,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const sections = [
  {
    icon: Cloud,
    title: "Firebase project connection",
    description:
      "Connect your Firebase project using its Project ID and public web config — the same values already visible in your Firebase console. We never ask for a service-account private key.",
  },
  {
    icon: Mail,
    title: "Email template editor",
    description:
      "Configure the verification, password reset, and email-change templates Firebase Auth sends, with a live preview and Firebase's template variables (%DISPLAY_NAME%, %LINK%, and more).",
  },
  {
    icon: KeyRound,
    title: "Authentication action URLs",
    description:
      "Set the continue URL Firebase redirects to after a user completes an email action. We validate the URL format and explain exactly what each field controls.",
  },
  {
    icon: Globe,
    title: "Custom domain & DNS",
    description:
      "Verify ownership of a custom sending domain with a DNS TXT record we actually check via a live DNS lookup — not a checkbox that always turns green.",
  },
  {
    icon: ShieldCheck,
    title: "Subdomain requests",
    description:
      "Request a free yourname.owenis.me subdomain, track its status (pending, approved, denied, needs changes), and see any message left by our team.",
  },
  {
    icon: Sparkles,
    title: "AI email generator",
    description:
      "Pick a type, tone, and purpose, and Groq drafts a ready-to-edit email. Nothing sends automatically — you review and save it yourself.",
  },
  {
    icon: Bot,
    title: "AI assistant",
    description:
      "Ask how any part of the platform works. The assistant only knows public documentation — it has no access to your account data or anyone else's.",
  },
  {
    icon: Users,
    title: "Public project directory",
    description:
      "Opt in to list your project publicly with a name and short description. Nothing private is ever shown without your explicit choice.",
  },
];

export default function Features() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl italic leading-tight text-[var(--color-text-primary)] sm:text-5xl">
          Everything you need to run Firebase email, cleanly
        </h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">
          One dashboard for the parts of Firebase Auth that are usually scattered across the console,
          your DNS provider, and a handful of docs tabs.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <section.icon size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{section.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{section.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
