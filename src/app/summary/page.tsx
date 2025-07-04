
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, ThumbsUp, ArrowRight, Home, TrendingUp, MessageSquareQuote, ClipboardCheck, GraduationCap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CompetencyRating {
  competency: string;
  rating: number;
  justification: string;
}

interface SuggestedAnswer {
    question: string;
    userAnswer: string;
    suggestedAnswer: string;
    answerAnalysis: string;
}

interface SummaryData {
  summary: string;
  competencyRatings: CompetencyRating[];
  suggestedAnswers: SuggestedAnswer[];
}

interface InterviewConfig {
  language: 'vi' | 'en';
}

const translations = {
    vi: {
        title: "Phản hồi phỏng vấn của bạn",
        description: "Đây là bản tóm tắt về hiệu suất của bạn.",
        loading: "Đang tải bản tóm tắt...",
        competencyTitle: "Đánh giá năng lực",
        noCompetencyData: "Không có dữ liệu đánh giá năng lực.",
        strengthsTitle: "Điểm mạnh",
        noStrengths: "Không có điểm mạnh cụ thể nào được xác định trong bản tóm tắt.",
        improvementsTitle: "Điểm cần cải thiện",
        noImprovements: "Không có lĩnh vực cụ thể nào cần cải thiện được xác định.",
        suggestionsTitle: "Gợi ý cải thiện câu trả lời",
        noSuggestions: "Không có gợi ý câu trả lời nào được tạo.",
        yourAnswer: "Câu trả lời của bạn:",
        aiSuggestion: "Gợi ý của AI:",
        answerAnalysis: "Phân tích câu trả lời",
        errorLoading: "Không thể tải bản tóm tắt.",
        backToHome: "Quay về trang chủ",
        tryAnother: "Thử một cuộc phỏng vấn khác",
        ratingLabel: "Đánh giá",
        ratingJustificationLabel: "Lý do",
    },
    en: {
        title: "Your Interview Feedback",
        description: "Here's a summary of your performance.",
        loading: "Loading summary...",
        competencyTitle: "Competency Ratings",
        noCompetencyData: "No competency rating data available.",
        strengthsTitle: "Strengths",
        noStrengths: "No specific strengths were identified in the summary.",
        improvementsTitle: "Areas for Improvement",
        noImprovements: "No specific areas for improvement were identified.",
        suggestionsTitle: "Answer Improvement Suggestions",
        noSuggestions: "No answer suggestions were generated.",
        yourAnswer: "Your Answer:",
        aiSuggestion: "AI's Suggestion:",
        answerAnalysis: "Answer Analysis",
        errorLoading: "Could not load summary.",
        backToHome: "Back to Home",
        tryAnother: "Try Another Interview",
        ratingLabel: "Rating",
        ratingJustificationLabel: "Justification",
    }
};

const chartConfigBase = {
  rating: {
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function SummaryPage() {
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [T, setT] = useState(translations.vi);
  const [chartConfig, setChartConfig] = useState(chartConfigBase);

  useEffect(() => {
    const storedSummary = localStorage.getItem('interviewSummary');
    const storedConfig = localStorage.getItem('interviewConfig');

    if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig(parsedConfig);
        const currentT = translations[parsedConfig.language || 'vi'];
        setT(currentT);
        setChartConfig({
            rating: {
                label: currentT.ratingLabel,
                color: "hsl(var(--primary))",
            },
        })
    } else {
        router.replace('/');
        return;
    }

    if (storedSummary) {
      try {
        setSummaryData(JSON.parse(storedSummary));
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
    if (!summaryData?.summary) return { strengths: [], improvements: [] };
    
    const lines = summaryData.summary.split('\n').filter(line => line.trim() !== '');
    let strengths: string[] = [];
    let improvements: string[] = [];
    let currentSection: 'strengths' | 'improvements' | null = null;
    
    const strengthKeywords = ['strengths:', 'điểm mạnh:'];
    const improvementKeywords = ['areas for improvement:', 'areas of improvement:', 'điểm cần cải thiện:'];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (strengthKeywords.some(keyword => lowerLine.includes(keyword))) {
        currentSection = 'strengths';
        const content = line.substring(line.indexOf(':') + 1).trim();
        if (content && !content.toLowerCase().startsWith('-')) strengths.push(content);
        continue;
      }
      if (improvementKeywords.some(keyword => lowerLine.includes(keyword))) {
        currentSection = 'improvements';
        const content = line.substring(line.indexOf(':') + 1).trim();
        if (content && !content.toLowerCase().startsWith('-')) improvements.push(content);
        continue;
      }
      
      if (currentSection === 'strengths' && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
        strengths.push(line.trim().substring(1).trim());
      } else if (currentSection === 'improvements' && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
        improvements.push(line.trim().substring(1).trim());
      }
    }
    
    if (strengths.length === 0 && improvements.length === 0 && summaryData.summary) {
        return { strengths: [summaryData.summary], improvements: [] };
    }

    return { strengths, improvements };
  }, [summaryData]);


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
            <Logo className="mb-4" />
            <CardTitle className="text-3xl font-bold">{T.title}</CardTitle>
            <CardDescription>{T.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            {loading ? (
                <div className="space-y-6">
                    <p>{T.loading}</p>
                    <Skeleton className="h-60 w-full" />
                    <Skeleton className="h-8 w-1/3 mt-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ) : summaryData ? (
                <>
                <div>
                  <h3 className="flex items-center text-xl font-semibold mb-4 text-primary-foreground/90">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      {T.competencyTitle}
                  </h3>
                  {summaryData.competencyRatings && summaryData.competencyRatings.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                      <BarChart data={summaryData.competencyRatings} margin={{ top: 20, right: 20, bottom: 5, left: 0 }} accessibilityLayer>
                          <CartesianGrid vertical={false} />
                          <XAxis
                              dataKey="competency"
                              tickLine={false}
                              tickMargin={10}
                              axisLine={false}
                              tickFormatter={(value) => value.split(' (')[0]}
                          />
                          <YAxis domain={[0, 10]} tickCount={6} />
                          <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent
                                  formatter={(value, name, props) => (
                                      <div className="flex flex-col gap-1 p-2 min-w-[200px] text-left">
                                          <div className="font-bold">{props.payload.competency}</div>
                                          <div className="text-sm">{T.ratingLabel}: <span className="font-semibold">{value}/10</span></div>
                                          <p className="text-sm text-muted-foreground max-w-xs">{props.payload.justification}</p>
                                      </div>
                                  )}
                              />}
                          />
                          <Bar dataKey="rating" fill="hsl(var(--primary))" radius={8} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-muted-foreground">{T.noCompetencyData}</p>
                  )}
                </div>

                <div>
                    <h3 className="flex items-center text-xl font-semibold mb-3 text-green-700">
                        <ThumbsUp className="mr-2 h-5 w-5" />
                        {T.strengthsTitle}
                    </h3>
                    {parsedSummary.strengths.length > 0 ? (
                        <ul className="space-y-2 list-disc pl-5 text-foreground/80">
                            {parsedSummary.strengths.map((point, i) => <li key={`s-${i}`}>{point}</li>)}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">{T.noStrengths}</p>
                    )}
                </div>
                <div>
                    <h3 className="flex items-center text-xl font-semibold mb-3 text-amber-700">
                        <Lightbulb className="mr-2 h-5 w-5" />
                        {T.improvementsTitle}
                    </h3>
                    {parsedSummary.improvements.length > 0 ? (
                        <ul className="space-y-2 list-disc pl-5 text-foreground/80">
                            {parsedSummary.improvements.map((point, i) => <li key={`i-${i}`}>{point}</li>)}
                        </ul>
                     ) : (
                        <p className="text-muted-foreground">{T.noImprovements}</p>
                    )}
                </div>
                
                <div>
                    <h3 className="flex items-center text-xl font-semibold mb-3 text-foreground">
                        <MessageSquareQuote className="mr-2 h-5 w-5" />
                        {T.suggestionsTitle}
                    </h3>
                    {summaryData.suggestedAnswers && summaryData.suggestedAnswers.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {summaryData.suggestedAnswers.map((item, i) => (
                                <AccordionItem value={`item-${i}`} key={`sa-${i}`}>
                                    <AccordionTrigger className="text-left font-semibold hover:no-underline text-base">
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">{T.yourAnswer}</h4>
                                            <blockquote className="text-sm text-foreground/80 italic border-l-2 border-border pl-3 py-1">
                                                {item.userAnswer}
                                            </blockquote>
                                        </div>
                                        {item.answerAnalysis && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-primary mb-1 flex items-center">
                                                    <ClipboardCheck className="mr-2 h-4 w-4" />
                                                    {T.answerAnalysis}
                                                </h4>
                                                <blockquote className="text-sm text-foreground/90 border-l-2 border-primary/50 pl-3 py-1 whitespace-pre-line">
                                                    {item.answerAnalysis}
                                                </blockquote>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-sm text-primary mb-1 flex items-center">
                                                <GraduationCap className="mr-2 h-4 w-4" />
                                                {T.aiSuggestion}
                                            </h4>
                                            <blockquote className="text-sm text-foreground/90 border-l-2 border-primary/50 pl-3 py-1 whitespace-pre-line">
                                                {item.suggestedAnswer}
                                            </blockquote>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-muted-foreground">{T.noSuggestions}</p>
                    )}
                </div>

                </>
            ) : (
                <p className="text-center text-muted-foreground">{T.errorLoading}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button onClick={handleStartOver} className="w-full" variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    {T.backToHome}
                </Button>
                <Button onClick={handleStartOver} className="w-full">
                    {T.tryAnother}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
