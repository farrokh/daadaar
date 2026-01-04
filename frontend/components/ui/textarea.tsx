import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground/60 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={`
            w-full rounded-lg border bg-foreground/[0.02] px-4 py-2.5 text-foreground
            placeholder:text-foreground/20
            focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50
            resize-y min-h-[100px]
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-foreground/10'}
            ${className}
          `}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
