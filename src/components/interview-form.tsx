
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, MessageCircle, Mic, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
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

const translations = {
  vi: {
    jobRoleLabel: "Chọn vai trò công việc",
    jobRolePlaceholder: "ví dụ: Kỹ sư phần mềm",
    softwareEngineer: "Kỹ sư phần mềm",
    productManager: "Quản lý sản phẩm",
    salesRepresentative: "Đại diện bán hàng",
    dataScientist: "Nhà khoa học dữ liệu",
    uxDesigner: "Nhà thiết kế UX/UI",
    uploadCvLabel: "Tải lên CV (Tùy chọn)",
    uploadCvDescription: "Tải lên CV của bạn để có trải nghiệm phỏng vấn được cá nhân hóa.",
    uploadButton: "Nhấn để tải lên",
    dragAndDrop: "hoặc kéo và thả",
    fileTypes: "PDF, DOCX, hoặc TXT (TỐI ĐA 5MB)",
    noFileSelected: "Chưa có tệp nào được chọn",
    fileSelected: "Tệp đã chọn:",
    interviewModeLabel: "Chọn chế độ phỏng vấn",
    chatMode: "Phỏng vấn qua tin nhắn",
    chatModeDescription: "Nhập câu trả lời của bạn.",
    voiceMode: "Phỏng vấn qua giọng nói",
    voiceModeDescription: "Nói câu trả lời của bạn.",
    micAccessDenied: "Truy cập Microphone bị từ chối",
    micAccessDescription: "Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt của bạn để tiếp tục với cuộc phỏng vấn bằng giọng nói.",
    errorTitle: "Lỗi",
    startError: "Không thể xử lý CV hoặc bắt đầu phỏng vấn. Vui lòng thử lại.",
    submitButtonLoading: "Đang bắt đầu...",
    submitButton: "Bắt đầu phỏng vấn",
    cvRequired: "CV là bắt buộc.",
    maxFileSize: "Kích thước tệp tối đa là 5MB.",
    jobRoleRequired: "Vui lòng chọn một vai trò công việc.",
    interviewModeRequired: "Vui lòng chọn chế độ phỏng vấn.",
  },
  en: {
    jobRoleLabel: "Select a job role",
    jobRolePlaceholder: "e.g., Software Engineer",
    softwareEngineer: "Software Engineer",
    productManager: "Product Manager",
    salesRepresentative: "Sales Representative",
    dataScientist: "Data Scientist",
    uxDesigner: "UX/UI Designer",
    uploadCvLabel: "Upload CV (Optional)",
    uploadCvDescription: "Upload your CV for a personalized interview experience.",
    uploadButton: "Click to upload",
    dragAndDrop: "or drag and drop",
    fileTypes: "PDF, DOCX, or TXT (MAX 5MB)",
    noFileSelected: "No file selected",
    fileSelected: "Selected file:",
    interviewModeLabel: "Select interview mode",
    chatMode: "Chat Interview",
    chatModeDescription: "Type your answers.",
    voiceMode: "Voice Interview",
    voiceModeDescription: "Speak your answers.",
    micAccessDenied: "Microphone Access Denied",
    micAccessDescription: "Please allow microphone access in your browser settings to proceed with a voice interview.",
    errorTitle: "Error",
    startError: "Could not process CV or start the interview. Please try again.",
    submitButtonLoading: "Starting Interview...",
    submitButton: "Start Interview",
    cvRequired: "CV is required.",
    maxFileSize: "Maximum file size is 5MB.",
    jobRoleRequired: "Please select a job role.",
    interviewModeRequired: "Please select an interview mode.",
  },
};

const fileToDataUri = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface InterviewFormProps {
  onFormSubmit: () => void;
  language: 'vi' | 'en';
}

export function InterviewForm({ onFormSubmit, language }: InterviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const T = translations[language];

  const formSchema = z.object({
    jobRole: z
      .string({ required_error: T.jobRoleRequired })
      .min(1, T.jobRoleRequired),
    cvFile: z
      .custom<FileList>()
      .refine((files) => files?.length > 0, T.cvRequired)
      .refine(
        (files) => files?.[0]?.size <= 5 * 1024 * 1024,
        T.maxFileSize
      )
      .optional(),
    interviewMode: z.enum(["chat", "voice"], {
      required_error: T.interviewModeRequired,
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interviewMode: "voice",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (values.interviewMode === "voice") {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Microphone permission denied:", err);
        toast({
          variant: "destructive",
          title: T.micAccessDenied,
          description: T.micAccessDescription,
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

      localStorage.setItem(
        "interviewConfig",
        JSON.stringify({
          jobRole: values.jobRole,
          interviewMode: values.interviewMode,
          cvText,
          language: language,
        })
      );

      onFormSubmit(); // Close modal
      router.push("/interview");
    } catch (error) {
      console.error("Failed to start interview:", error);
      toast({
        variant: "destructive",
        title: T.errorTitle,
        description: T.startError,
      });
      setIsLoading(false);
    }
  };

  const cvFile = form.watch("cvFile");
  const fileName =
    cvFile && cvFile.length > 0 ? cvFile[0].name : T.noFileSelected;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="jobRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">{T.jobRoleLabel}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={T.jobRolePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={translations.en.softwareEngineer}>{T.softwareEngineer}</SelectItem>
                  <SelectItem value={translations.en.productManager}>{T.productManager}</SelectItem>
                  <SelectItem value={translations.en.salesRepresentative}>{T.salesRepresentative}</SelectItem>
                  <SelectItem value={translations.en.dataScientist}>{T.dataScientist}</SelectItem>
                  <SelectItem value={translations.en.uxDesigner}>{T.uxDesigner}</SelectItem>
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
              <FormLabel className="font-bold">{T.uploadCvLabel}</FormLabel>
              <FormDescription>{T.uploadCvDescription}</FormDescription>
              <FormControl>
                <div
                  className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">{T.uploadButton}</span> {T.dragAndDrop}
                  </p>
                  <p className="text-xs text-muted-foreground">{T.fileTypes}</p>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </div>
              </FormControl>
              {fileName !== T.noFileSelected && (
                <div className="text-sm text-muted-foreground pt-2">
                  {T.fileSelected} {fileName}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interviewMode"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="font-bold">{T.interviewModeLabel}</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => field.onChange("chat")}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-4 transition-all",
                      field.value === "chat"
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <MessageCircle className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-bold">{T.chatMode}</h3>
                        <p className="text-sm text-muted-foreground">
                          {T.chatModeDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => field.onChange("voice")}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-4 transition-all relative overflow-hidden",
                      field.value === "voice"
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Mic className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-bold">{T.voiceMode}</h3>
                        <p className="text-sm text-muted-foreground">
                          {T.voiceModeDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full text-lg py-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {T.submitButtonLoading}
            </>
          ) : (
            T.submitButton
          )}
        </Button>
      </form>
    </Form>
  );
}
