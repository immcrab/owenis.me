import { motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  Globe,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

const features = [
  {
    icon: Cloud,
    title: "Connect your Firebase project",
    description: "Link your existing Firebase project with just your Project ID — no admin keys ever leave your machine.",
  },
  {
    icon: Mail,
    title: "Email templates, made clear",
    description: "Edit verification, reset, and change-email templates with a live preview before you save.",
  },
  {
    icon: Globe,
    title: "Custom subdomain",
    description: "Request a free *.owenis.me subdomain for your project and track approval status in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Action URLs, validated",
    description: "Configure the URLs Firebase Auth redirects to after email actions, with format validation built in.",
  },
  {
    icon: Sparkles,
    title: "AI email generator",
    description: "Describe the tone and purpose — get a polished, editable email draft powered by Groq in seconds.",
  },
  {
    icon: Zap,
    title: "One dashboard",
    description: "Status, DNS, templates, and requests — everything about your Firebase email setup in one place.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
          >
            <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
            Built for teams running Firebase Auth
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 text-balance font-serif text-5xl italic leading-[1.05] text-[var(--color-text-primary)] sm:text-6xl"
          >
            Manage your Firebase email setup from one place
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-balance text-base text-[var(--color-text-secondary)] sm:text-lg"
          >
            Connect your Firebase project, configure email templates and authentication
            action URLs, request a custom subdomain, and let AI help you write better emails.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/sign-up" className={buttonVariants("primary", "lg")}>
              Get started free <ArrowRight size={16} />
            </Link>
            <Link to="/how-it-works" className={buttonVariants("outline", "lg")}>
              See how it works
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Card className="h-full p-5 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:-translate-y-0.5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                  <feature.icon size={18} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-border-subtle)] px-4 py-20 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h2 className="font-serif text-3xl italic text-[var(--color-text-primary)] sm:text-4xl">
            Ready to clean up your Firebase email setup?
          </h2>
          <p className="max-w-lg text-sm text-[var(--color-text-secondary)] sm:text-base">
            Free to start. Connect a project in minutes.
          </p>
          <Link to="/sign-up" className={buttonVariants("primary", "lg")}>
            Create your account <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
