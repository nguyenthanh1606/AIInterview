"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Bot, Loader2, MessageCircle, Mic, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { extractCvData } from "@/ai/flows/cv-data-extraction";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";


const formSchema = z.object({
  jobRole: z.string({ required_error: "Please select a job role." }).min(1, "Please select a job role."),
  cvFile: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "CV is required.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .optional(),
  interviewMode: z.enum(["chat", "voice"], { required_error: "Please select an interview mode." }),
});

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});


export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interviewMode: "chat",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      let cvText: string | null = null;
      if (values.cvFile && values.cvFile.length > 0) {
        const file = values.cvFile[0];
        const cvDataUri = await fileToDataUri(file);
        const extractedData = await extractCvData({ cvDataUri });
        cvText = JSON.stringify(extractedData, null, 2);
      }

      localStorage.setItem('interviewConfig', JSON.stringify({
        jobRole: values.jobRole,
        interviewMode: values.interviewMode,
        cvText,
      }));

      router.push('/interview');

    } catch (error) {
      console.error("Failed to start interview:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process CV or start interview. Please try again.",
      });
      setIsLoading(false);
    }
  };
  
  const cvFile = form.watch('cvFile');
  const fileName = cvFile && cvFile.length > 0 ? cvFile[0].name : "No file selected";


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-background to-accent/20">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-3xl font-bold">AI Mock Interview</CardTitle>
            <CardDescription>Prepare for your dream job. No sign up required.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-8">
                <FormField
                  control={form.control}
                  name="jobRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-lg">Select Job Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="e.g., Software Engineer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                          <SelectItem value="Product Manager">Product Manager</SelectItem>
                          <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                          <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                          <SelectItem value="UX/UI Designer">UX/UI Designer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cvFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-lg">Upload CV (Optional)</FormLabel>
                      <FormDescription>Upload your CV to get a personalized interview experience.</FormDescription>
                      <FormControl>
                        <div 
                          className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (MAX. 5MB)</p>
                            <Input 
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept=".pdf,.docx,.txt"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                        </div>
                      </FormControl>
                      {fileName !== "No file selected" && <div className="text-sm text-muted-foreground pt-2">Selected file: {fileName}</div>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewMode"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="font-bold text-lg">Choose Interview Mode</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            onClick={() => field.onChange("chat")}
                            className={cn(
                              "cursor-pointer rounded-lg border-2 p-4 transition-all",
                              field.value === "chat" ? "border-primary bg-primary/10 shadow-lg" : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <MessageCircle className="h-8 w-8 text-primary" />
                              <div>
                                <h3 className="font-bold">Chat Interview</h3>
                                <p className="text-sm text-muted-foreground">Type your answers.</p>
                              </div>
                            </div>
                          </div>
                          <div
                             onClick={() => {
                                field.onChange("voice");
                                toast({ title: "Coming Soon!", description: "Voice interviews will be available in a future update." });
                              }}
                            className={cn(
                              "cursor-not-allowed rounded-lg border-2 p-4 transition-all relative overflow-hidden",
                              field.value === "voice" ? "border-primary bg-primary/10 shadow-lg" : "border-border hover:border-primary/50",
                              "opacity-50"
                            )}
                          >
                            <Badge variant="secondary" className="absolute top-2 right-2">Coming Soon</Badge>
                             <div className="flex items-center gap-4">
                              <Mic className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <h3 className="font-bold">Voice Interview</h3>
                                <p className="text-sm text-muted-foreground">Speak your answers.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Starting Interview...
                    </>
                  ) : (
                    "Start Free Interview"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  );
}
