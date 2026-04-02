
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  message: z.string().min(1, {
    message: "Message cannot be empty.",
  }),
});

type ChatFormProps = {
  onSubmit: (message: string) => void;
  isLoading: boolean;
};

export function ChatForm({ onSubmit, isLoading }: ChatFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoading || !values.message.trim()) return;
    onSubmit(values.message);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex items-start gap-2">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea
                  placeholder="Tell me about your skills and interests to get project ideas..."
                  className="resize-none"
                  rows={1}
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(handleFormSubmit)();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} size="icon">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send />
          )}
           <span className="sr-only">Send</span>
        </Button>
      </form>
    </Form>
  );
}
