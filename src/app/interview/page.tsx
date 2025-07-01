"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Bot, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { generateInterviewSummary } from '@/ai/flows/post-interview-summary';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface InterviewConfig {
  jobRole: string;
  interviewMode: 'chat' | 'voice';
  cvText: string | null;
}

const MOCK_QUESTIONS = [
  "Can you tell me a little bit about yourself?",
  "What are your biggest strengths that you would bring to this role?",
  "Could you describe one of your biggest weaknesses and how you're working to improve it?",
  "Where do you see yourself professionally in the next five years?",
  "Why are you interested in this position and our company?",
];

export default function InterviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedConfig = localStorage.getItem('interviewConfig');
    if (!storedConfig) {
      router.replace('/');
      return;
    }
    const parsedConfig = JSON.parse(storedConfig);
    setConfig(parsedConfig);

    setMessages([
      {
        role: 'ai',
        content: `Hello! I'll be your interviewer today. We're interviewing for the ${parsedConfig.jobRole} position. Let's get started.`,
      },
    ]);

    setTimeout(() => {
        addAiMessage(MOCK_QUESTIONS[0]);
    }, 1000);

  }, [router]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const addAiMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: 'ai', content }]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || isFinishing || currentQuestionIndex >= MOCK_QUESTIONS.length) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < MOCK_QUESTIONS.length) {
        addAiMessage(MOCK_QUESTIONS[nextIndex]);
        setCurrentQuestionIndex(nextIndex);
      }
      setIsLoading(false);
    }, 1500);
  };
  
  const handleFinishInterview = async () => {
    setIsFinishing(true);
    toast({ title: "Analyzing your interview...", description: "Please wait while we generate your feedback." });
    try {
        const interviewTranscript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        
        if (!config) throw new Error("Interview configuration not found.");

        const summaryResult = await generateInterviewSummary({
            interviewTranscript,
            jobRole: config.jobRole,
            cvText: config.cvText || undefined,
        });

        localStorage.setItem('interviewSummary', JSON.stringify(summaryResult));
        router.push('/summary');
    } catch (error) {
        console.error("Failed to generate summary:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate your interview summary. Please try again later.",
        });
        setIsFinishing(false);
    }
  }

  if (!config) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
        <Logo />
        <div className="text-sm text-muted-foreground">
          Role: <span className="font-semibold text-foreground">{config.jobRole}</span>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? "justify-end" : "justify-start")}>
                  {message.role === 'ai' && (
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-md rounded-2xl px-4 py-3 shadow-md", message.role === 'user' ? "rounded-br-none bg-primary text-primary-foreground" : "rounded-bl-none bg-card")}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><User size={18} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-4 justify-start">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-md rounded-2xl px-4 py-3 shadow-md rounded-bl-none bg-card">
                       <Skeleton className="h-4 w-10" />
                    </div>
                 </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </main>

      <footer className="sticky bottom-0 z-10 border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          {currentQuestionIndex >= MOCK_QUESTIONS.length -1 && !isLoading && !isFinishing ? (
             <Button onClick={handleFinishInterview} className="w-full" disabled={isFinishing}>
                {isFinishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finishing...</> : 'Finish Interview & Get Feedback'}
            </Button>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1"
                disabled={isLoading || isFinishing}
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!userInput.trim() || isLoading || isFinishing}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
}
