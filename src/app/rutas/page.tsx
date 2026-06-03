'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { rutaApi, Ruta } from '@/hooks/useApi';
import { ReusableTable, Column } from '@/components/shared/ReusableTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { PlusCircle, Route } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Lightweight form layout helpers
function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className || ''}`}>{children}</div>;
}

function FieldLabel({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export default function RutasPage() {
  const { data: rutas = [], isLoading } = rutaApi.useGetAll();

  const createMutation = rutaApi.useCreate();
  const updateMutation = rutaApi.useUpdate();
  const deleteMutation = rutaApi.useDelete();

  const [isOpen, setIsOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | undefined>(undefined);

  // AlertDialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Define TanStack Form for Routes
  const form = useForm({
    defaultValues: {
      nombre: '',
      colorHex: '#3B82F6',
    },
    onSubmit: async ({ value }) => {
      try {
        if (editingRuta) {
          const updateData = {
            ...value,
            id: editingRuta.id,
          };
          await updateMutation.mutateAsync(updateData);
        } else {
          await createMutation.mutateAsync(value);
        }
        setIsOpen(false);
      } catch {
        // Handled globally
      }
    },
  });

  // Sync editing item state to form fields
  useEffect(() => {
    if (isOpen) {
      if (editingRuta) {
        form.setFieldValue('nombre', editingRuta.nombre);
        form.setFieldValue('colorHex', editingRuta.colorHex);
      } else {
        form.reset();
      }
    }
  }, [editingRuta, isOpen, form]);

  const columns: Column<Ruta>[] = [
    {
      key: 'nombre',
      header: 'Nombre de la Ruta',
      render: (item) => (
        <span className="font-semibold text-foreground flex items-center gap-2">
          <Route className="size-4 text-muted-foreground" />
          {item.nombre}
        </span>
      ),
    },
    {
      key: 'colorHex',
      header: 'Color de Identificación',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="size-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm"
            style={{ backgroundColor: item.colorHex }}
          />
          <span className="font-mono text-xs uppercase text-muted-foreground">{item.colorHex}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
    },
  ];

  const handleCreateClick = () => {
    setEditingRuta(undefined);
    setIsOpen(true);
  };

  const handleEditClick = (ruta: Ruta) => {
    setEditingRuta(ruta);
    setIsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (idToDelete) {
      try {
        await deleteMutation.mutateAsync(idToDelete);
      } catch {
        // Handled globally
      } finally {
        setIdToDelete(null);
      }
    }
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Route className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Gestión de Rutas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administra las rutas disponibles para asignar a tus vendedores y clasificar ubicaciones.
                </p>
              </div>
            </div>
            <Button onClick={handleCreateClick} className="rounded-xl gap-2 h-11 self-start sm:self-auto">
              <PlusCircle className="size-4" />
              Nueva Ruta
            </Button>
          </div>

          <ReusableTable
            columns={columns}
            data={rutas}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </main>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="sm:max-w-md bg-background border-l border-border overflow-y-auto p-4">
            <SheetHeader className="pb-4 border-b border-border/60">
              <SheetTitle>
                {editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}
              </SheetTitle>
              <SheetDescription>
                {editingRuta
                  ? 'Modifica los campos de la ruta seleccionada.'
                  : 'Rellena el formulario para dar de alta una nueva ruta de distribución.'}
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field
                    name="nombre"
                    validators={{
                      onChange: ({ value }) => {
                        const res = z.string().min(1, 'El nombre es requerido').safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name} required>
                          Nombre de la Ruta
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Ej. Ruta Poniente o Ruta 12"
                          className="rounded-xl px-4 py-3 bg-card"
                        />
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field
                    name="colorHex"
                    validators={{
                      onChange: ({ value }) => {
                        const res = z
                          .string()
                          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato hexadecimal inválido (ej. #3B82F6)')
                          .safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name} required>
                          Color hexadecimal
                        </FieldLabel>
                        <div className="flex items-center gap-3">
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Ej. #3B82F6"
                            className="rounded-xl px-4 py-3 bg-card flex-1 font-mono uppercase"
                          />
                          <div className="relative size-11 shrink-0 rounded-xl border border-input overflow-hidden cursor-pointer">
                            <input
                              type="color"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="absolute inset-0 size-full scale-150 cursor-pointer p-0 border-0"
                            />
                          </div>
                        </div>
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl px-5"
                  >
                    Cancelar
                  </Button>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className="rounded-xl px-6"
                      >
                        {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Guardando...
                          </div>
                        ) : editingRuta ? (
                          'Guardar Cambios'
                        ) : (
                          'Crear Ruta'
                        )}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
            </div>
          </SheetContent>
        </Sheet>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación de la ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la ruta permanentemente. Los vendedores y puntos asociados quedarán sin ruta asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar Ruta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
