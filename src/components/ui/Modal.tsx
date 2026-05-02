import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ open, onOpenChange, title, children, className, size = 'md' }: ModalProps) => {
  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-void/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'bg-surface-glass border border-gold/30 backdrop-blur-2xl rounded-3xl p-8 w-full max-h-[85vh] overflow-auto shadow-card-hover',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            maxW,
            className
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-serif font-semibold text-starlight">{title}</Dialog.Title>
            <Dialog.Close className="p-2 text-nebula hover:text-starlight hover:bg-surface-hover rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const ModalTrigger = Dialog.Trigger;
