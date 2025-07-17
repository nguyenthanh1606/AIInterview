
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
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { generateConversationalResponse } from '@/ai/flows/generate-conversational-response';
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

const translations = {
    vi: {
        jobRole: 'Vai trò',
        initialLoading: 'Xin chào! Tôi sẽ là người phỏng vấn bạn hôm nay. Chúng ta đang phỏng vấn cho vị trí',
        generatingQuestions: 'Tôi đang chuẩn bị một vài câu hỏi, vui lòng đợi trong giây lát...',
        readyToStart: 'Hãy bắt đầu.',
        questionGenerationError: 'Không thể tạo câu hỏi.',
        questionGenerationErrorToast: 'Không thể tạo câu hỏi phỏng vấn. Vui lòng thử lại.',
        errorTitle: 'Lỗi',
        responseErrorToast: 'Đã xảy ra lỗi khi tạo phản hồi. Chuyển sang câu hỏi tiếp theo.',
        configError: 'Không tìm thấy cấu hình phỏng vấn.',
        finishingToastTitle: 'Đang phân tích cuộc phỏng vấn của bạn...',
        finishingToastDescription: 'Vui lòng đợi trong khi chúng tôi tạo phản hồi của bạn.',
        summaryError: 'Không thể tạo tóm tắt.',
        summaryErrorToast: 'Không thể tạo tóm tắt phỏng vấn của bạn. Vui lòng thử lại sau.',
        micAccessError: 'Lỗi truy cập micro:',
        micErrorToastTitle: 'Lỗi Micro',
        micErrorToastDescription: 'Không thể truy cập micro. Vui lòng kiểm tra quyền.',
        ttsError: 'Không thể phát âm thanh phỏng vấn.',
        ttsErrorTitle: 'Lỗi âm thanh',
        transcriptionErrorToastTitle: 'Lỗi phiên âm',
        transcriptionErrorToastDescription1: 'Không thể hiểu âm thanh. Vui lòng thử lại.',
        transcriptionErrorToastDescription2: 'Không thể phiên âm âm thanh.',
        finishButtonLoading: 'Đang hoàn thành...',
        finishButton: 'Hoàn thành & Nhận phản hồi',
        inputPlaceholder: 'Nhập câu trả lời của bạn tại đây...',
        transcribing: 'Đang phiên âm câu trả lời của bạn...',
        aiSpeaking: 'Người phỏng vấn đang nói...',
        micHintStop: 'Nhấn để dừng ghi âm',
        micHintStart: 'Nhấn để ghi âm câu trả lời của bạn',
        micHintInterrupt: 'Bạn có thể ngắt lời để trả lời',
        micHintGenerating: 'Đang tạo câu hỏi...',
    },
    en: {
        jobRole: 'Role',
        initialLoading: 'Hello! I will be your interviewer today. We are interviewing for the position of',
        generatingQuestions: "I'm preparing a few questions, please wait a moment...",
        readyToStart: "Let's begin.",
        questionGenerationError: 'Could not generate questions.',
        questionGenerationErrorToast: 'Failed to generate interview questions. Please try again.',
        errorTitle: 'Error',
        responseErrorToast: 'An error occurred while generating a response. Moving to the next question.',
        configError: 'Interview configuration not found.',
        finishingToastTitle: 'Analyzing your interview...',
        finishingToastDescription: 'Please wait while we generate your feedback.',
        summaryError: 'Could not generate summary.',
        summaryErrorToast: 'Could not generate your interview summary. Please try again later.',
        micAccessError: 'Error accessing microphone:',
        micErrorToastTitle: 'Microphone Error',
        micErrorToastDescription: 'Could not access the microphone. Please check your permissions.',
        ttsError: 'Could not play interview audio.',
        ttsErrorTitle: 'Audio Error',
        transcriptionErrorToastTitle: 'Transcription Error',
        transcriptionErrorToastDescription1: 'Could not understand the audio. Please try again.',
        transcriptionErrorToastDescription2: 'Could not transcribe the audio.',
        finishButtonLoading: 'Finishing...',
        finishButton: 'Finish & Get Feedback',
        inputPlaceholder: 'Type your answer here...',
        transcribing: 'Transcribing your answer...',
        aiSpeaking: 'Interviewer is speaking...',
        micHintStop: 'Click to stop recording',
        micHintStart: 'Click to record your answer',
        micHintInterrupt: 'You can interrupt to answer',
        micHintGenerating: 'Generating questions...',
    }
};

const languageMap = {
    vi: 'Vietnamese',
    en: 'English'
};

export default function InterviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [T, setT] = useState(translations.vi);
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const storedConfig = localStorage.getItem('interviewConfig');
    if (!storedConfig) {
      router.replace('/');
      return;
    }
    const parsedConfig: InterviewConfig = JSON.parse(storedConfig);
    setConfig(parsedConfig);
    const currentT = translations[parsedConfig.language];
    setT(currentT);

    const startInterview = async () => {
        setIsGeneratingQuestions(true);
        setMessages([
            {
                role: 'ai',
                content: `${currentT.initialLoading} ${parsedConfig.jobRole}. ${currentT.generatingQuestions}`,
            },
        ]);

        try {
            const { questions } = await generateInterviewQuestions({ 
                jobRole: parsedConfig.jobRole, 
                language: languageMap[parsedConfig.language]
            });
            if (!questions || questions.length === 0) {
                throw new Error(currentT.questionGenerationError);
            }
            setInterviewQuestions(questions);
            
            setMessages([
                {
                    role: 'ai',
                    content: `${currentT.initialLoading} ${parsedConfig.jobRole}. ${currentT.readyToStart}`,
                },
            ]);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            await addAiMessage(questions[0]);

        } catch (error) {
            console.error("Failed to generate questions:", error);
            toast({
                variant: "destructive",
                title: currentT.errorTitle,
                description: currentT.questionGenerationErrorToast,
            });
            router.push('/');
        } finally {
            setIsGeneratingQuestions(false);
        }
    }
    startInterview();
  }, [router, toast]);
  
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
            const result = await textToSpeech(content, config.language);
            if (audioPlayerRef.current) {
                audioPlayerRef.current.src = result.media;
                audioPlayerRef.current.play();
            }
        } catch (error) {
            console.error("TTS Error:", error);
            toast({ variant: "destructive", title: T.ttsErrorTitle, description: T.ttsError });
            setIsAiSpeaking(false);
        }
    }
  };

  const handleUserAnswer = async (answer: string) => {
    if (!answer.trim() || isLoading || isFinishing) return;

    setMessages((prev) => [...prev, { role: 'user', content: answer }]);
    setUserInput('');

    if (currentQuestionIndex >= interviewQuestions.length - 1) {
      // Last question has been answered
      return;
    }
    
    setIsLoading(true);

    if (config?.interviewMode === 'voice') {
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const nextIndex = currentQuestionIndex + 1;

    try {
        if (!config) throw new Error(T.configError);

        const response = await generateConversationalResponse({
            jobRole: config.jobRole,
            previousQuestion: interviewQuestions[currentQuestionIndex],
            userAnswer: answer,
            nextQuestion: interviewQuestions[nextIndex],
            language: languageMap[config.language],
        });
        
        await addAiMessage(response.aiResponse);
        setCurrentQuestionIndex(nextIndex);

    } catch (error) {
        console.error("Failed to generate conversational response:", error);
        toast({
            variant: "destructive",
            title: T.errorTitle,
            description: T.responseErrorToast,
        });
        // Fallback to just asking the next question directly
        await addAiMessage(interviewQuestions[nextIndex]);
        setCurrentQuestionIndex(nextIndex);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUserAnswer(userInput);
  };

  const handleFinishInterview = async () => {
    setIsFinishing(true);
    toast({ title: T.finishingToastTitle, description: T.finishingToastDescription });
    try {
        const interviewTranscript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        if (!config) throw new Error(T.configError);
        const summaryResult = await generateInterviewSummary({
            interviewTranscript,
            jobRole: config.jobRole,
            cvText: config.cvText || undefined,
            language: languageMap[config.language],
        });
        localStorage.setItem('interviewSummary', JSON.stringify(summaryResult));
        router.push('/summary');
    } catch (error) {
        console.error(T.summaryError, error);
        toast({
            variant: "destructive",
            title: T.errorTitle,
            description: T.summaryErrorToast,
        });
        setIsFinishing(false);
    }
  }

  // --- Voice methods ---
  const handleStartRecording = async () => {
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
    }
    setIsAiSpeaking(false);

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
            console.error(T.micAccessError, err);
            toast({ variant: "destructive", title: T.micErrorToastTitle, description: T.micErrorToastDescription });
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
             toast({ variant: "destructive", title: T.transcriptionErrorToastTitle, description: T.transcriptionErrorToastDescription1 });
        }
    } catch (error) {
        console.error("Transcription Error:", error);
        toast({ variant: "destructive", title: T.transcriptionErrorToastTitle, description: T.transcriptionErrorToastDescription2 });
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

  const interviewIsOver = !isGeneratingQuestions && currentQuestionIndex >= interviewQuestions.length - 1 && !isLoading;
  const voiceControlsDisabled = isLoading || isFinishing || isTranscribing || isGeneratingQuestions || isAiSpeaking;
  const chatControlsDisabled = isLoading || isFinishing || isGeneratingQuestions;

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
        <Logo />
        <div className="text-sm text-muted-foreground">
          {T.jobRole}: <span className="font-semibold text-foreground">{config.jobRole}</span>
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
             <Button onClick={handleFinishInterview} className="w-full" disabled={isFinishing}>
                {isFinishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{T.finishButtonLoading}</> : T.finishButton}
            </Button>
          ) : config.interviewMode === 'chat' ? (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={T.inputPlaceholder}
                className="flex-1"
                disabled={chatControlsDisabled}
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!userInput.trim() || chatControlsDisabled}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-2">
                {isTranscribing ? (
                    <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {T.transcribing}</div>
                ) : isAiSpeaking && !isRecording ? (
                    <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {T.aiSpeaking}</div>
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
                    {isRecording ? T.micHintStop : isTranscribing ? "" : isAiSpeaking ? T.micHintInterrupt : isGeneratingQuestions ? T.micHintGenerating : T.micHintStart}
                </p>
            </div>
          )}
        </div>
        {config.interviewMode === 'voice' && (
          <audio ref={audioPlayerRef} onPlay={() => setIsAiSpeaking(true)} onEnded={() => setIsAiSpeaking(false)} className="hidden" />
        )}
      </footer>
    </div>
  );
}
