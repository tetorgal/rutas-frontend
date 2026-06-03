'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { vendedorApi, Vendedor, useRutas } from '@/hooks/useApi';
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

import { UserPlus, Users, CheckCircle, XCircle, Route } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';

// Lightweight form layout helpers
function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className || ''}`}>{children}</div>;
}

// Fixed required prop warning in typescript
function FieldLabel({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export default function VendedoresPage() {
  const { data: vendedores = [], isLoading } = vendedorApi.useGetAll();
  const { data: rutas = [] } = useRutas();

  const createMutation = vendedorApi.useCreate();
  const updateMutation = vendedorApi.useUpdate();
  const deleteMutation = vendedorApi.useDelete();

  const [isOpen, setIsOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | undefined>(undefined);

  // AlertDialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lidToDelete, setLidToDelete] = useState<string | null>(null);

  // Map routes for the select dropdown
  const routeOptions = rutas.map((r) => ({
    label: r.nombre,
    value: r.id,
  }));

  // Define TanStack Form
  const form = useForm({
    defaultValues: {
      lid: '',
      nombreReal: '',
      telefono: '',
      rutaActualId: '',
      activo: true,
    },
    onSubmit: async ({ value }) => {
      try {
        if (editingVendedor) {
          const updateData = {
            ...value,
            lid: editingVendedor.lid, // Force key consistency
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

  // Sync editing item state to the form fields
  useEffect(() => {
    if (isOpen) {
      if (editingVendedor) {
        form.setFieldValue('lid', editingVendedor.lid);
        form.setFieldValue('nombreReal', editingVendedor.nombreReal);
        form.setFieldValue('telefono', editingVendedor.telefono || '');
        form.setFieldValue('rutaActualId', editingVendedor.rutaActualId || '');
        form.setFieldValue('activo', editingVendedor.activo);
      } else {
        form.reset();
      }
    }
  }, [editingVendedor, isOpen, form]);

  const columns: Column<Vendedor>[] = [
    {
      key: 'lid',
      header: 'LID / WhatsApp',
    },
    {
      key: 'nombreReal',
      header: 'Nombre',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (item) => <span>{item.telefono || 'Sin registrar'}</span>,
    },
    {
      key: 'rutaActualId',
      header: 'Ruta Asignada',
      render: (item) => {
        if (!item.rutaActual) {
          return <span className="text-muted-foreground text-xs italic">Sin ruta</span>;
        }
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
            style={{
              borderColor: `${item.rutaActual.colorHex}40`,
              backgroundColor: `${item.rutaActual.colorHex}15`,
              color: item.rutaActual.colorHex,
            }}
          >
            <Route className="size-3" />
            {item.rutaActual.nombre}
          </span>
        );
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            item.activo
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
          }`}
        >
          {item.activo ? (
            <>
              <CheckCircle className="size-3.5" /> Activo
            </>
          ) : (
            <>
              <XCircle className="size-3.5" /> Inactivo
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
    },
  ];

  const handleCreateClick = () => {
    setEditingVendedor(undefined);
    setIsOpen(true);
  };

  const handleEditClick = (vendedor: Vendedor) => {
    setEditingVendedor(vendedor);
    setIsOpen(true);
  };

  const handleDeleteClick = (lid: string) => {
    setLidToDelete(lid);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (lidToDelete) {
      try {
        await deleteMutation.mutateAsync(lidToDelete);
      } catch {
        // Handled globally
      } finally {
        setLidToDelete(null);
      }
    }
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Users className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Gestión de Vendedores
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administra los vendedores autorizados y sus rutas asignadas.
                </p>
              </div>
            </div>
            <Button onClick={handleCreateClick} className="rounded-xl gap-2 h-11 self-start sm:self-auto">
              <UserPlus className="size-4" />
              Nuevo Vendedor
            </Button>
          </div>

          <ReusableTable
            columns={columns}
            data={vendedores}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </main>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="sm:max-w-md bg-background border-l border-border overflow-y-auto p-4">
            <SheetHeader className="pb-4 border-b border-border/60">
              <SheetTitle>
                {editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </SheetTitle>
              <SheetDescription>
                {editingVendedor
                  ? 'Modifica los campos del vendedor seleccionado.'
                  : 'Rellena el formulario para dar de alta un nuevo vendedor.'}
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
                    name="lid"
                    validators={{
                      onChange: ({ value }) => {
                        if (editingVendedor) return undefined;
                        const res = z.string().min(1, 'El LID/WhatsApp es requerido').safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name} required={!editingVendedor}>
                          ID de WhatsApp / LID
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Ej. 5216183951156"
                          disabled={!!editingVendedor}
                          className="rounded-xl px-4 py-3 bg-card"
                        />
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field
                    name="nombreReal"
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
                          Nombre completo
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Ej. Juan Pérez"
                          className="rounded-xl px-4 py-3 bg-card"
                        />
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field name="telefono">
                    {(field) => (
                      <FieldGroup>
                        <FieldLabel htmlFor={field.name}>
                          Teléfono de contacto
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Ej. 6181234567"
                          className="rounded-xl px-4 py-3 bg-card"
                        />
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field name="rutaActualId">
                    {(field) => (
                      <FieldGroup>
                        <FieldLabel htmlFor={field.name}>
                          Ruta Asignada
                        </FieldLabel>
                        <select
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onChange={(e) => field.handleChange(e.target.value || '')}
                          className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Selecciona una ruta</option>
                          {routeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field name="activo">
                    {(field) => (
                      // <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 cursor-pointer hover:bg-muted/40 transition">
                      //   <input
                      //     type="checkbox"
                      //     checked={!!field.state.value}
                      //     onChange={(e) => field.handleChange(e.target.checked)}
                      //     className="size-4 rounded border-border text-primary focus:ring-primary"
                      //   />
                      //   <div className="text-sm font-medium text-foreground">
                      //     Vendedor activo (Autorizado para reportar ubicaciones)
                      //   </div>
                      // </label>
      <FieldGroup className="flex gap-2 items-center justify-start">

        <Checkbox
      className='size-4 rounded border-border text-primary focus:ring-primary'
          onCheckedChange={(checked) => field.handleChange(checked === true)}
          checked={field.state.value}
          
        />

          <span className='text-tiny text-foreground'>

   Vendedor activo 

          </span>


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
                        ) : editingVendedor ? (
                          'Guardar Cambios'
                        ) : (
                          'Crear Vendedor'
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
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará el vendedor permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar Vendedor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
