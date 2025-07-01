"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Bot, User, Mic, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { generateInterviewSummary } from '@/ai/flows/post-interview-summary';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
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
  language: 'vi' | 'en';
}

const MOCK_QUESTIONS = [
  "Bạn có thể giới thiệu một chút về bản thân không?",
  "Điểm mạnh lớn nhất của bạn mà bạn sẽ mang lại cho vai trò này là gì?",
  "Bạn có thể mô tả một trong những điểm yếu lớn nhất của mình và cách bạn đang cải thiện nó không?",
  "Bạn thấy mình ở đâu trong sự nghiệp trong năm năm tới?",
  "Tại sao bạn quan tâm đến vị trí này và công ty của chúng tôi?",
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
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const storedConfig = localStorage.getItem('interviewConfig');
    if (!storedConfig) {
      router.replace('/');
      return;
    }
    const parsedConfig: InterviewConfig = JSON.parse(storedConfig);
    setConfig(parsedConfig);

    const startInterview = async () => {
        setMessages([
            {
                role: 'ai',
                content: `Xin chào! Tôi sẽ là người phỏng vấn bạn hôm nay. Chúng ta đang phỏng vấn cho vị trí ${parsedConfig.jobRole}. Hãy bắt đầu.`,
            },
        ]);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(true);
        await addAiMessage(MOCK_QUESTIONS[0]);
        setIsLoading(false);
    }
    startInterview();
  }, [router]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const addAiMessage = async (content: string) => {
    setMessages((prev) => [...prev, { role: 'ai', content }]);
    if (config?.interviewMode === 'voice') {
        try {
            setIsAiSpeaking(true);
            const result = await textToSpeech(content, config.language);
            setAudioSrc(result.media);
        } catch (error) {
            console.error("TTS Error:", error);
            toast({ variant: "destructive", title: "Lỗi âm thanh", description: "Không thể phát âm thanh phỏng vấn." });
            setIsAiSpeaking(false);
        }
    }
  };

  const askNextQuestion = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < MOCK_QUESTIONS.length) {
      setCurrentQuestionIndex(nextIndex);
      await addAiMessage(MOCK_QUESTIONS[nextIndex]);
    }
    setIsLoading(false);
  };

  const handleUserAnswer = async (answer: string) => {
    if (!answer.trim() || isLoading || isFinishing) return;
    setMessages((prev) => [...prev, { role: 'user', content: answer }]);
    setUserInput('');
    if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      await askNextQuestion();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUserAnswer(userInput);
  };

  const handleFinishInterview = async () => {
    setIsFinishing(true);
    toast({ title: "Đang phân tích cuộc phỏng vấn của bạn...", description: "Vui lòng đợi trong khi chúng tôi tạo phản hồi của bạn." });
    try {
        const interviewTranscript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        if (!config) throw new Error("Không tìm thấy cấu hình phỏng vấn.");
        const summaryResult = await generateInterviewSummary({
            interviewTranscript,
            jobRole: config.jobRole,
            cvText: config.cvText || undefined,
            language: 'Vietnamese',
        });
        localStorage.setItem('interviewSummary', JSON.stringify(summaryResult));
        router.push('/summary');
    } catch (error) {
        console.error("Không thể tạo tóm tắt:", error);
        toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tạo tóm tắt phỏng vấn của bạn. Vui lòng thử lại sau.",
        });
        setIsFinishing(false);
    }
  }

  // --- Voice methods ---
  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            mediaRecorder.current.ondataavailable = (event) => audioChunks.current.push(event.data);
            mediaRecorder.current.onstop = handleTranscription;
            audioChunks.current = [];
            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Lỗi truy cập micro:', err);
            toast({ variant: "destructive", title: "Lỗi Micro", description: "Không thể truy cập micro. Vui lòng kiểm tra quyền." });
        }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    }
  };
  
  const blobToDataUri = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const handleTranscription = async () => {
    if (audioChunks.current.length === 0) return;
    setIsTranscribing(true);
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    try {
        const audioDataUri = await blobToDataUri(audioBlob);
        const { transcript } = await transcribeAudio({ audioDataUri });
        if (transcript.trim()) {
            await handleUserAnswer(transcript);
        } else {
             toast({ variant: "destructive", title: "Lỗi phiên âm", description: "Không thể hiểu âm thanh. Vui lòng thử lại." });
        }
    } catch (error) {
        console.error("Lỗi phiên âm:", error);
        toast({ variant: "destructive", title: "Lỗi phiên âm", description: "Không thể phiên âm âm thanh." });
    } finally {
        setIsTranscribing(false);
        audioChunks.current = [];
    }
  };

  if (!config) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const interviewIsOver = currentQuestionIndex >= MOCK_QUESTIONS.length - 1 && !isLoading;
  const voiceControlsDisabled = isLoading || isFinishing || isAiSpeaking || isTranscribing;

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
        <Logo />
        <div className="text-sm text-muted-foreground">
          Vai trò: <span className="font-semibold text-foreground">{config.jobRole}</span>
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
          {interviewIsOver && !isFinishing ? (
             <Button onClick={handleFinishInterview} className="w-full" disabled={isFinishing || voiceControlsDisabled}>
                {isFinishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang hoàn thành...</> : 'Hoàn thành & Nhận phản hồi'}
            </Button>
          ) : config.interviewMode === 'chat' ? (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Nhập câu trả lời của bạn tại đây..."
                className="flex-1"
                disabled={isLoading || isFinishing}
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!userInput.trim() || isLoading || isFinishing}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-2">
                {isTranscribing ? (
                    <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang phiên âm câu trả lời của bạn...</div>
                ) : isAiSpeaking ? (
                    <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Người phỏng vấn đang nói...</div>
                ) : (
                    <Button 
                        onClick={isRecording ? handleStopRecording : handleStartRecording} 
                        size="icon" 
                        className={cn("w-20 h-20 rounded-full", isRecording && "bg-destructive hover:bg-destructive/90")}
                        disabled={voiceControlsDisabled}
                    >
                        {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                    </Button>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {isRecording ? "Nhấn để dừng ghi âm" : isTranscribing ? "" : isAiSpeaking ? "" : "Nhấn để ghi âm câu trả lời của bạn"}
                </p>
            </div>
          )}
        </div>
        {audioSrc && <audio ref={audioPlayerRef} src={audioSrc} autoPlay onPlay={() => setIsAiSpeaking(true)} onEnded={() => {setIsAiSpeaking(false); setAudioSrc(null);}} className="hidden" />}
      </footer>
    </div>
  );
}
