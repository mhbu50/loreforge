import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('[&_tr]:border-b [&_tr]:border-white/[0.06]', className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b border-white/[0.06] transition-colors hover:bg-surface-hover', className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('h-12 px-4 text-left align-middle text-xs font-semibold text-nebula/60 uppercase tracking-wider', className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('p-4 align-middle text-starlight', className)} {...props} />
);

export const TableCaption = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <caption className={cn('mt-4 text-sm text-nebula/60', className)} {...props} />
);
