import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      /* uniform dark / light styling */
      'flex min-h-[60px] w-full resize-none rounded-md border border-ring',
        'bg-background px-3 py-2 text-base shadow-sm text-foreground ',
        'placeholder:text-muted-foreground ',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ',
        'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
