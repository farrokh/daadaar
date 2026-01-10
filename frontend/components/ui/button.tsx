import { cn } from '@/lib/utils';
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

    const variantClasses = {
      default: 'bg-foreground text-background hover:bg-foreground/90',
      primary: 'bg-primary text-white hover:opacity-90',
      secondary: 'bg-secondary text-white hover:opacity-90 backdrop-blur-sm',
      outline: 'border border-foreground/10 bg-transparent hover:bg-foreground/5',
      ghost: 'hover:bg-foreground/5',
      link: 'text-primary underline-offset-4 hover:underline',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizeClasses = {
      xs: 'h-6 px-2 text-[10px]',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

// Export both named and default for flexibility
export { Button };
export default Button;
