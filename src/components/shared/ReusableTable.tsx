'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

export interface Column<T> {
  key: keyof T | 'actions';
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface ReusableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function ReusableTable<T extends { id?: string; lid?: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading,
}: ReusableTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-muted-foreground">
        <p className="text-sm font-medium">No se encontraron registros</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-foreground">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={item.id || item.lid}
                className="transition hover:bg-muted/10"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 align-middle">
                    {col.render ? (
                      col.render(item)
                    ) : col.key === 'actions' ? (
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="size-4 text-primary" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 border-destructive/20 hover:bg-destructive/10"
                            onClick={() => onDelete((item.id || item.lid) as string)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      String(item[col.key as keyof T] ?? '')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
