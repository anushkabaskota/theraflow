
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { bookSlot, findSlots, startBooking } from '@/app/chat/actions';
import { ChatMessage as ChatMessageType, UserProfile } from '@/types';
import { ChatMessage } from './ChatMessage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/lib/firestore';
import { SendHorizonal } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

type FormValues = z.infer<typeof formSchema>;

type ConversationState = 'greeting' | 'date_pending' | 'slot_pending' | 'confirmation_pending' | 'finished';

export function ChatInterface({ initialTherapistId }: { initialTherapistId?: string }) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetTherapist, setTargetTherapist] = useState<UserProfile | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>('greeting');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  });

  const aiAvatar = PlaceHolderImages.find(p => p.id === 'ai-avatar')?.imageUrl;

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      const initialMessage = await startBooking();
      setMessages([
        { id: 'init', role: 'assistant', content: initialMessage },
      ]);
      setConversationState('date_pending');
      setIsLoading(false);
    };
    initChat();
  }, []);

  useEffect(() => {
    if (initialTherapistId) {
      getUserProfile(initialTherapistId).then(setTargetTherapist).catch(console.error);
    }
  }, [initialTherapistId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // A bit of a hack to scroll to the bottom.
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  const handleSlotSelect = async (slot: string) => {
    if (!user || profile?.role !== 'user') return;

    setAvailableSlots([]);
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `I'd like to book the ${new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} slot.`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setConversationState('confirmation_pending');

    try {
      const therapistId = targetTherapist?.uid || "therapist_default_id";
      const therapistName = targetTherapist?.displayName || "Dr. Anna Smith";
      const isTrainee = targetTherapist?.role === 'trainee';

      const result = await bookSlot(slot, user.uid, profile.displayName || 'User', therapistId, therapistName, isTrainee);

      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.confirmationMessage,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationState('finished');
    } catch (error) {
      toast({ title: 'Error booking slot', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  const onSubmit = async (data: FormValues) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: data.message,
    };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();
    setIsLoading(true);

    if (conversationState === 'date_pending') {
      try {
        const result = await findSlots(data.message, targetTherapist?.uid || 'therapist_default_id');
        const assistantMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.formattedSlots,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setAvailableSlots(result.availableSlots);
        setConversationState('slot_pending');
      } catch (error) {
        const errorMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm sorry, I couldn't find any available slots for that date range. Please try another.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <ChatMessage message={{ id: 'loading', role: 'assistant', content: '...' }} isLoading />}
          {availableSlots.length > 0 && (
            <div className="flex justify-end">
              <div className="p-3 rounded-lg max-w-xs lg:max-w-md animate-bubble-in">
                <div className="flex items-start gap-3">
                  {aiAvatar && <img src={aiAvatar} alt="AI" className="h-8 w-8 rounded-full" />}
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map(slot => (
                      <Button key={slot} variant="outline" size="sm" onClick={() => handleSlotSelect(slot)}>
                        {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Type your message..." {...field} disabled={isLoading || conversationState === 'finished'} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={isLoading || conversationState === 'finished'}>
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
