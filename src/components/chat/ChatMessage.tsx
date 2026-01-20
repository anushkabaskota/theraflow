import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2 } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const { profile } = useAuth();
  const isAssistant = message.role === 'assistant';

  const userAvatar = profile?.photoURL || PlaceHolderImages.find(p => p.id === 'patient-avatar')?.imageUrl;
  const aiAvatar = PlaceHolderImages.find(p => p.id === 'ai-avatar')?.imageUrl;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  };

  return (
    <div
      className={cn(
        'flex items-end gap-3 animate-bubble-in',
        isAssistant ? 'justify-start' : 'justify-end'
      )}
    >
      {isAssistant && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={aiAvatar} />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-xs rounded-lg p-3 text-sm lg:max-w-md',
          isAssistant
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          message.content
        )}
      </div>
      {!isAssistant && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={userAvatar} />
          <AvatarFallback>{getInitials(profile?.displayName)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
