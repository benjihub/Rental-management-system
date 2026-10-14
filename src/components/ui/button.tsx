import * as React from 'react';import { cva,type VariantProps } from 'class-variance-authority';import { cn } from '@/lib/utils';
const buttonVariants=cva('inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',{variants:{variant:{default:'bg-emerald-700 text-white hover:bg-emerald-800',outline:'border border-neutral-200 bg-white hover:bg-neutral-50',destructive:'bg-red-50 text-red-700 hover:bg-red-100'},size:{default:'h-10 px-4 py-2',sm:'h-8 px-3 text-xs'}},defaultVariants:{variant:'default',size:'default'}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{}
export function Button(input:ButtonProps){const {className,variant,size,...props}=input as any;return <button data-slot="button" className={cn(buttonVariants({variant,size}),className)} {...props}/>}
export {buttonVariants};
