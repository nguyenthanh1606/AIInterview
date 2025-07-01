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
import { useToast } from "@/hooks/use-toast";
import { extractCvData } from "@/ai/flows/cv-data-extraction";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";


const formSchema = z.object({
  jobRole: z.string({ required_error: "Vui lòng chọn một vai trò công việc." }).min(1, "Vui lòng chọn một vai trò công việc."),
  cvFile: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "CV là bắt buộc.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `Kích thước tệp tối đa là 5MB.`)
    .optional(),
  interviewMode: z.enum(["chat", "voice"], { required_error: "Vui lòng chọn chế độ phỏng vấn." }),
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
      interviewMode: "voice",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    if (values.interviewMode === 'voice') {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error("Microphone permission denied:", err);
            toast({
                variant: "destructive",
                title: "Truy cập Microphone bị từ chối",
                description: "Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt của bạn để tiếp tục với cuộc phỏng vấn bằng giọng nói.",
            });
            setIsLoading(false);
            return;
        }
    }

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
        language: 'vi',
      }));

      router.push('/interview');

    } catch (error) {
      console.error("Failed to start interview:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xử lý CV hoặc bắt đầu phỏng vấn. Vui lòng thử lại.",
      });
      setIsLoading(false);
    }
  };
  
  const cvFile = form.watch('cvFile');
  const fileName = cvFile && cvFile.length > 0 ? cvFile[0].name : "Chưa có tệp nào được chọn";


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-background to-accent/20">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-3xl font-bold">Phỏng vấn thử với AI</CardTitle>
            <CardDescription>Chuẩn bị cho công việc mơ ước của bạn. Không cần đăng ký.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-8">
                <FormField
                  control={form.control}
                  name="jobRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-lg">Chọn vai trò công việc</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="ví dụ: Kỹ sư phần mềm" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Kỹ sư phần mềm">Kỹ sư phần mềm</SelectItem>
                          <SelectItem value="Quản lý sản phẩm">Quản lý sản phẩm</SelectItem>
                          <SelectItem value="Đại diện bán hàng">Đại diện bán hàng</SelectItem>
                          <SelectItem value="Nhà khoa học dữ liệu">Nhà khoa học dữ liệu</SelectItem>
                          <SelectItem value="Nhà thiết kế UX/UI">Nhà thiết kế UX/UI</SelectItem>
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
                      <FormLabel className="font-bold text-lg">Tải lên CV (Tùy chọn)</FormLabel>
                      <FormDescription>Tải lên CV của bạn để có trải nghiệm phỏng vấn được cá nhân hóa.</FormDescription>
                      <FormControl>
                        <div 
                          className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo và thả</p>
                            <p className="text-xs text-muted-foreground">PDF, DOCX, hoặc TXT (TỐI ĐA 5MB)</p>
                            <Input 
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept=".pdf,.docx,.txt"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                        </div>
                      </FormControl>
                      {fileName !== "Chưa có tệp nào được chọn" && <div className="text-sm text-muted-foreground pt-2">Tệp đã chọn: {fileName}</div>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewMode"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="font-bold text-lg">Chọn chế độ phỏng vấn</FormLabel>
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
                                <h3 className="font-bold">Phỏng vấn qua tin nhắn</h3>
                                <p className="text-sm text-muted-foreground">Nhập câu trả lời của bạn.</p>
                              </div>
                            </div>
                          </div>
                          <div
                             onClick={() => field.onChange("voice")}
                            className={cn(
                              "cursor-pointer rounded-lg border-2 p-4 transition-all relative overflow-hidden",
                              field.value === "voice" ? "border-primary bg-primary/10 shadow-lg" : "border-border hover:border-primary/50"
                            )}
                          >
                             <div className="flex items-center gap-4">
                              <Mic className="h-8 w-8 text-primary" />
                              <div>
                                <h3 className="font-bold">Phỏng vấn qua giọng nói</h3>
                                <p className="text-sm text-muted-foreground">Nói câu trả lời của bạn.</p>
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
                      Bắt đầu phỏng vấn...
                    </>
                  ) : (
                    "Bắt đầu phỏng vấn miễn phí"
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
