
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/neighbor-buy/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  serviceType: z.enum(['Cleaning', 'Handyman', 'Childcare', 'Tutoring', 'Other']),
  providerName: z.string().min(2, 'Provider name must be at least 2 characters.'),
  recommendation: z.string().min(10, 'Recommendation must be at least 10 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function RecommendServicePage() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerName: '',
      recommendation: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
    toast({
      title: '服务已推荐!',
      description: '您的推荐已与社区分享。',
    });
    form.reset();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>推荐服务</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>服务类型</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择服务类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cleaning">清洁</SelectItem>
                            <SelectItem value="Handyman">维修</SelectItem>
                            <SelectItem value="Childcare">育儿</SelectItem>
                            <SelectItem value="Tutoring">辅导</SelectItem>
                            <SelectItem value="Other">其他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="providerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>服务提供商名称/业务</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：张三或阳光清洁公司" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>您的推荐</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="您为什么推荐这项服务？分享您的经验。"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? '正在分享...' : '分享推荐'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
