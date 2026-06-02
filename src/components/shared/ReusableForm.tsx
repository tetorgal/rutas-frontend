'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'checkbox' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
}

interface ReusableFormProps<T> {
  fields: FormFieldConfig<T>[];
  initialData?: Partial<T>;
  onSubmit: (data: T) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function ReusableForm<T>({
  fields,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  isSubmitting,
}: ReusableFormProps<T>) {
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});

  // Reset/Initialize form when initialData changes
  useEffect(() => {
    const defaultData: Record<string, string | boolean> = {};
    fields.forEach((field) => {
      const fieldName = String(field.name);
      if (field.type === 'checkbox') {
        defaultData[fieldName] = !!initialData?.[field.name];
      } else {
        defaultData[fieldName] = String(initialData?.[field.name] ?? '');
      }
    });
    setFormData(defaultData);
  }, [initialData, fields]);

  const handleChange = (
    name: keyof T,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [String(name)]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const init = (initialData || {}) as Record<string, unknown>;
    const submissionData = {
      ...formData,
      ...(init.id ? { id: init.id } : {}),
      ...(init.lid ? { lid: init.lid } : {}),
    } as unknown as T;
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = formData[String(field.name)];

          return (
            <div
              key={String(field.name)}
              className={
                field.type === 'textarea' || field.type === 'checkbox'
                  ? 'sm:col-span-2'
                  : ''
              }
            >
              {field.type === 'checkbox' ? (
                <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 cursor-pointer hover:bg-muted/40 transition">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="text-sm font-medium text-foreground">
                    {field.label}
                  </div>
                </label>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      value={String(value ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                      className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={String(value ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required}
                      className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {field.placeholder || 'Selecciona una opción'}
                      </option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      value={String(value ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="rounded-xl px-4 py-3 bg-card"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl px-5"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl px-6"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Guardando...
            </div>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
