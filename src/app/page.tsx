"use client";

import React from "react";
import Image from "next/image";
import { Bot, LineChart, MoveRight, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterviewForm } from "@/components/interview-form";
import { Logo } from "@/components/logo";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Logo />
          <Button onClick={() => setIsModalOpen(true)}>
            Start Interview <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-24 lg:py-32">
          <div className="absolute inset-0 -z-20 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="container text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              AI-Powered Mock Interviews
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-6">
              Practice your interview skills with realistic, AI-driven
              conversations. Get instant, unbiased feedback to land your dream
              job. No sign-up required.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => setIsModalOpen(true)}>
                Start Your Free Interview
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-24">
          <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
            <div className="space-y-6">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                Unbiased & Consistent
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Get Objective Feedback on Your Skills
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Our AI provides standardized, objective feedback on your
                performance, helping you identify strengths and weaknesses
                without human bias. It analyzes your answers, communication, and
                confidence.
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Detailed performance analysis on key competencies.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Bot className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Personalized question suggestions and improvement tips.
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="https://placehold.co/500x500.png"
                data-ai-hint="woman portrait professional"
                width={500}
                height={500}
                alt="Feedback illustration"
                className="rounded-xl shadow-2xl rotate-3"
              />
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-24 bg-muted/30">
          <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
            <div className="flex justify-center order-last lg:order-first">
              <Image
                src="https://placehold.co/500x400.png"
                data-ai-hint="data chart analytics"
                width={500}
                height={400}
                alt="Insights illustration"
                className="rounded-xl shadow-2xl -rotate-3"
              />
            </div>
            <div className="space-y-6">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                Actionable Insights
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Track Your Progress Over Time
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Go beyond a simple score. Get detailed insights into your
                communication, technical knowledge, and role fit. See how you
                improve with each practice session.
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <LineChart className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Visualize your performance with intuitive charts.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Compare answers and see suggested improvements.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container flex flex-col items-center justify-center gap-4">
          <Logo />
          <p className="text-center text-sm text-muted-foreground">
            Practice makes perfect. Start your journey to interview success
            today.
          </p>
        </div>
      </footer>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Set Up Your Mock Interview
            </DialogTitle>
            <DialogDescription>
              Select a job role and your preferred interview mode to get
              started.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <InterviewForm onFormSubmit={() => setIsModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
