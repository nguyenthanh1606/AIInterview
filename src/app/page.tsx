
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
import { cn } from "@/lib/utils";

const translations = {
  vi: {
    startInterview: "Bắt đầu phỏng vấn",
    mainTitle: "Phỏng vấn thử với AI",
    subTitle: "Luyện tập kỹ năng phỏng vấn của bạn với các cuộc trò chuyện thực tế do AI điều khiển. Nhận phản hồi tức thì, khách quan để có được công việc mơ ước của bạn. Không cần đăng ký.",
    startFreeInterview: "Bắt đầu phỏng vấn miễn phí",
    feature1Tag: "Khách quan & Nhất quán",
    feature1Title: "Nhận phản hồi khách quan về kỹ năng của bạn",
    feature1Desc: "AI của chúng tôi cung cấp phản hồi chuẩn hóa, khách quan về hiệu suất của bạn, giúp bạn xác định điểm mạnh và điểm yếu mà không có sự thiên vị của con người. Nó phân tích câu trả lời, giao tiếp và sự tự tin của bạn.",
    feature1Point1: "Phân tích hiệu suất chi tiết về các năng lực chính.",
    feature1Point2: "Gợi ý câu hỏi cá nhân hóa và mẹo cải thiện.",
    feature2Tag: "Thông tin chi tiết hữu ích",
    feature2Title: "Theo dõi tiến trình của bạn theo thời gian",
    feature2Desc: "Không chỉ là một điểm số đơn giản. Nhận thông tin chi tiết về giao tiếp, kiến thức kỹ thuật và sự phù hợp với vai trò của bạn. Xem cách bạn cải thiện qua mỗi buổi thực hành.",
    feature2Point1: "Trực quan hóa hiệu suất của bạn với các biểu đồ trực quan.",
    feature2Point2: "So sánh các câu trả lời và xem các cải tiến được đề xuất.",
    footerText: "Luyện tập tạo nên sự hoàn hảo. Bắt đầu hành trình đến thành công phỏng vấn ngay hôm nay.",
    dialogTitle: "Thiết lập cuộc phỏng vấn thử của bạn",
    dialogDescription: "Chọn vai trò công việc và chế độ phỏng vấn ưa thích của bạn để bắt đầu.",
  },
  en: {
    startInterview: "Start Interview",
    mainTitle: "AI-Powered Mock Interviews",
    subTitle: "Practice your interview skills with realistic, AI-driven conversations. Get instant, unbiased feedback to land your dream job. No sign-up required.",
    startFreeInterview: "Start Your Free Interview",
    feature1Tag: "Unbiased & Consistent",
    feature1Title: "Get Objective Feedback on Your Skills",
    feature1Desc: "Our AI provides standardized, objective feedback on your performance, helping you identify strengths and weaknesses without human bias. It analyzes your answers, communication, and confidence.",
    feature1Point1: "Detailed performance analysis on key competencies.",
    feature1Point2: "Personalized question suggestions and improvement tips.",
    feature2Tag: "Actionable Insights",
    feature2Title: "Track Your Progress Over Time",
    feature2Desc: "Go beyond a simple score. Get detailed insights into your communication, technical knowledge, and role fit. See how you improve with each practice session.",
    feature2Point1: "Visualize your performance with intuitive charts.",
    feature2Point2: "Compare answers and see suggested improvements.",
    footerText: "Practice makes perfect. Start your journey to interview success today.",
    dialogTitle: "Set Up Your Mock Interview",
    dialogDescription: "Select a job role and your preferred interview mode to get started.",
  }
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<'vi' | 'en'>('vi');

  const T = translations[language];

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button size="sm" variant={language === 'vi' ? 'default' : 'ghost'} onClick={() => setLanguage('vi')}>VI</Button>
              <Button size="sm" variant={language === 'en' ? 'default' : 'ghost'} onClick={() => setLanguage('en')}>EN</Button>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              {T.startInterview} <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-24 lg:py-32">
          <div className="absolute inset-0 -z-20 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="container text-center px-4">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              {T.mainTitle}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-6">
              {T.subTitle}
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => setIsModalOpen(true)}>
                {T.startFreeInterview}
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-24">
          <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-24 px-4">
            <div className="space-y-6">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {T.feature1Tag}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                {T.feature1Title}
              </h2>
              <p className="max-w-xl text-muted-foreground">
                {T.feature1Desc}
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{T.feature1Point1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Bot className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{T.feature1Point2}</span>
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
          <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-24 px-4">
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
                {T.feature2Tag}
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                {T.feature2Title}
              </h2>
              <p className="max-w-xl text-muted-foreground">
                {T.feature2Desc}
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <LineChart className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{T.feature2Point1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{T.feature2Point2}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container flex flex-col items-center justify-center gap-4 px-4">
          <Logo />
          <p className="text-center text-sm text-muted-foreground">
            {T.footerText}
          </p>
        </div>
      </footer>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {T.dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {T.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <InterviewForm onFormSubmit={() => setIsModalOpen(false)} language={language} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
