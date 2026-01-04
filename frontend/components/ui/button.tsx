import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
      default: 'bg-foreground text-background hover:bg-foreground/90',
      primary: 'bg-accent-primary text-white hover:bg-accent-primary/90',
      secondary: 'bg-foreground/10 text-foreground hover:bg-foreground/20 backdrop-blur-sm',
      outline: 'border border-foreground/10 bg-transparent hover:bg-foreground/5',
      ghost: 'hover:bg-foreground/5',
      link: 'text-accent-primary underline-offset-4 hover:underline',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
