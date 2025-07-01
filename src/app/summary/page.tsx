"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, ThumbsUp, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

interface SummaryOutput {
  summary: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSummary = localStorage.getItem('interviewSummary');
    if (storedSummary) {
      try {
        setSummary(JSON.parse(storedSummary));
      } catch (error) {
        console.error("Failed to parse summary:", error);
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
    setLoading(false);
  }, [router]);
  
  const handleStartOver = () => {
    localStorage.removeItem('interviewConfig');
    localStorage.removeItem('interviewSummary');
    router.push('/');
  };

  const parsedSummary = React.useMemo(() => {
    if (!summary?.summary) return { strengths: [], improvements: [] };
    
    const lines = summary.summary.split('\n').filter(line => line.trim() !== '');
    let strengths: string[] = [];
    let improvements: string[] = [];
    let currentSection: 'strengths' | 'improvements' | null = null;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('strengths:') || lowerLine.includes('điểm mạnh:')) {
        currentSection = 'strengths';
        const content = line.substring(line.indexOf(':') + 1).trim();
        if (content && !content.toLowerCase().startsWith('-')) strengths.push(content);
        continue;
      }
      if (lowerLine.includes('areas for improvement:') || lowerLine.includes('areas of improvement:') || lowerLine.includes('điểm cần cải thiện:')) {
        currentSection = 'improvements';
        const content = line.substring(line.indexOf(':') + 1).trim();
        if (content && !content.toLowerCase().startsWith('-')) improvements.push(content);
        continue;
      }
      
      if (currentSection === 'strengths' && line.trim().startsWith('-')) {
        strengths.push(line.trim().substring(1).trim());
      } else if (currentSection === 'improvements' && line.trim().startsWith('-')) {
        improvements.push(line.trim().substring(1).trim());
      }
    }
    
    // Fallback if parsing fails
    if (strengths.length === 0 && improvements.length === 0 && summary.summary) {
        return { strengths: [summary.summary], improvements: [] };
    }

    return { strengths, improvements };
  }, [summary]);


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
            <Logo className="mb-4" />
            <CardTitle className="text-3xl font-bold">Phản hồi phỏng vấn của bạn</CardTitle>
            <CardDescription>Đây là bản tóm tắt về hiệu suất của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-8 w-1/3 mt-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ) : summary ? (
                <>
                <div>
                    <h3 className="flex items-center text-xl font-semibold mb-3 text-green-700">
                        <ThumbsUp className="mr-2 h-5 w-5" />
                        Điểm mạnh
                    </h3>
                    {parsedSummary.strengths.length > 0 ? (
                        <ul className="space-y-2 list-disc pl-5 text-foreground/80">
                            {parsedSummary.strengths.map((point, i) => <li key={`s-${i}`}>{point}</li>)}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">Không có điểm mạnh cụ thể nào được xác định trong bản tóm tắt.</p>
                    )}
                </div>
                <div>
                    <h3 className="flex items-center text-xl font-semibold mb-3 text-amber-700">
                        <Lightbulb className="mr-2 h-5 w-5" />
                        Điểm cần cải thiện
                    </h3>
                    {parsedSummary.improvements.length > 0 ? (
                        <ul className="space-y-2 list-disc pl-5 text-foreground/80">
                            {parsedSummary.improvements.map((point, i) => <li key={`i-${i}`}>{point}</li>)}
                        </ul>
                     ) : (
                        <p className="text-muted-foreground">Không có lĩnh vực cụ thể nào cần cải thiện được xác định.</p>
                    )}
                </div>
                </>
            ) : (
                <p className="text-center text-muted-foreground">Không thể tải bản tóm tắt.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button onClick={handleStartOver} className="w-full" variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Quay về trang chủ
                </Button>
                <Button onClick={handleStartOver} className="w-full">
                    Thử một cuộc phỏng vấn khác
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
