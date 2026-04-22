'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Modern subtle overlay */}
      <div
        className="fixed inset-0 bg-gray-900/20 dark:bg-black/55 backdrop-blur-[2px] transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog Content */}
      <div className="relative z-50 w-full max-w-lg animate-in fade-in-0 zoom-in-95 duration-200">{children}</div>
    </div>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-card rounded-2xl shadow-2xl border border-gray-200 dark:border-border p-6 max-h-[90vh] overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn('text-xl font-bold text-gray-900 dark:text-foreground', className)}>{children}</h2>;
}

export function DialogDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-muted-foreground mt-2', className)}>{children}</p>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-end gap-2 mt-6', className)}>{children}</div>
  );
}

