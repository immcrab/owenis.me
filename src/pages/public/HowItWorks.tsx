import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up with email and password. We'll send a verification link right away.",
  },
  {
    step: "02",
    title: "Connect your Firebase project",
    description:
      "Enter your Firebase Project ID and public web config from the Firebase console. No admin credentials required.",
  },
  {
    step: "03",
    title: "Configure email & action URLs",
    description:
      "Edit your auth email templates, set the continue URL for post-action redirects, and add a custom sending domain if you want one.",
  },
  {
    step: "04",
    title: "Verify DNS (if applicable)",
    description:
      "Add the TXT record we generate to your DNS provider. We check it with a real lookup — verification only turns green once it actually resolves.",
  },
  {
    step: "05",
    title: "Request a subdomain",
    description:
      "Ask for yourname.owenis.me. Our team reviews requests and you'll see the status update from pending to approved (or get a note on what to change).",
  },
  {
    step: "06",
    title: "Manage it all from your dashboard",
    description:
      "Come back any time to update templates, regenerate AI-drafted emails, or check on request status.",
  },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl italic leading-tight text-[var(--color-text-primary)] sm:text-5xl">
        How it works
      </h1>
      <p className="mt-4 text-[var(--color-text-secondary)]">
        From zero to a fully configured Firebase email setup, in six steps.
      </p>

      <ol className="mt-12 space-y-8">
        {steps.map((item) => (
          <li key={item.step} className="flex gap-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-accent)]">
              {item.step}
            </div>
            <div className="pt-1.5">
              <h3 className="font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <Link to="/sign-up" className={buttonVariants("primary", "lg")}>
          Start now
        </Link>
      </div>
    </div>
  );
}
