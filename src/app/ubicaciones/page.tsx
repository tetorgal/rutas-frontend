'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useUbicaciones, useRutas, vendedorApi, ubicacionApi, Ubicacion } from '@/hooks/useApi';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarInset, SidebarRail, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/built/Sidebar';
import { MapPin, Route, Phone, PlusCircle } from 'lucide-react';
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

export default function UbicacionesPage() {
  const { data: ubicaciones = [], isLoading } = useUbicaciones();
  const { data: rutas = [] } = useRutas();
  const { data: vendedores = [] } = vendedorApi.useGetAll();

  const createMutation = ubicacionApi.useCreate();
  const updateMutation = ubicacionApi.useUpdate();
  const deleteMutation = ubicacionApi.useDelete();

  const [isOpen, setIsOpen] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | undefined>(undefined);

  // AlertDialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const routeOptions = rutas.map((r) => ({
    label: r.nombre,
    value: r.id,
  }));

  const vendedorOptions = vendedores.map((v) => ({
    label: `${v.nombreReal} (${v.telefono || v.lid})`,
    value: v.lid,
  }));

  const weekdays = [
    { value: 'LUNES', label: 'Lunes' },
    { value: 'MARTES', label: 'Martes' },
    { value: 'MIERCOLES', label: 'Miércoles' },
    { value: 'JUEVES', label: 'Jueves' },
    { value: 'VIERNES', label: 'Viernes' },
    { value: 'SABADO', label: 'Sábado' },
  ];

  // Define TanStack Form for Ubicaciones
  const form = useForm({
    defaultValues: {
      nombre: '',
      SAP: '',
      latitud: 0,
      longitud: 0,
      urlOriginal: '',
      vendedorLid: '',
      rutaId: '',
      diasVisita: [] as string[],
    },
    onSubmit: async ({ value }) => {
      try {
        const submissionData = {
          ...value,
          vendedorLid: value.vendedorLid || null,
          rutaId: value.rutaId || null,
          diasVisita: value.diasVisita as Ubicacion['diasVisita'],
        };
        if (editingUbicacion) {
          const updateData = {
            ...submissionData,
            id: editingUbicacion.id,
          };
          await updateMutation.mutateAsync(updateData);
        } else {
          await createMutation.mutateAsync(submissionData);
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
      if (editingUbicacion) {
        form.setFieldValue('nombre', editingUbicacion.nombre);
        form.setFieldValue('SAP', editingUbicacion.SAP);
        form.setFieldValue('latitud', editingUbicacion.latitud);
        form.setFieldValue('longitud', editingUbicacion.longitud);
        form.setFieldValue('urlOriginal', editingUbicacion.urlOriginal || '');
        form.setFieldValue('vendedorLid', editingUbicacion.vendedorLid || '');
        form.setFieldValue('rutaId', editingUbicacion.rutaId || '');
        form.setFieldValue('diasVisita', editingUbicacion.diasVisita || []);
      } else {
        form.reset();
      }
    }
  }, [editingUbicacion, isOpen, form]);

  const columns: Column<Ubicacion>[] = [
    {
      key: 'nombre',
      header: 'Cliente / Sucursal',
      render: (item) => (
        <span className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          {item.nombre}
        </span>
      ),
    },
    {
      key: 'SAP',
      header: 'Código SAP',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/65 px-2 py-0.5 rounded border border-border">
          {item.SAP || 'S/N'}
        </span>
      ),
    },
    {
      key: 'rutaId',
      header: 'Ruta Asignada',
      render: (item) => {
        if (!item.ruta) {
          return <span className="text-muted-foreground text-xs italic">Sin ruta</span>;
        }
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
            style={{
              borderColor: `${item.ruta.colorHex}40`,
              backgroundColor: `${item.ruta.colorHex}15`,
              color: item.ruta.colorHex,
            }}
          >
            <Route className="size-3" />
            {item.ruta.nombre}
          </span>
        );
      },
    },
    {
      key: 'diasVisita',
      header: 'Días de Visita',
      render: (item) => {
        const days = item.diasVisita || [];
        if (days.length === 0) {
          return <span className="text-muted-foreground text-xs italic">No programado</span>;
        }
        // Map LUNES -> L, MARTES -> M, MIERCOLES -> X, JUEVES -> J, VIERNES -> V, SABADO -> S
        const dayMap: Record<string, string> = {
          LUNES: 'L',
          MARTES: 'M',
          MIERCOLES: 'X',
          JUEVES: 'J',
          VIERNES: 'V',
          SABADO: 'S',
        };
        return (
          <div className="flex gap-1">
            {weekdays.map((wd) => {
              const isScheduled = (days as string[]).includes(wd.value);
              const dayLetter = dayMap[wd.value];
              return (
                <span
                  key={wd.value}
                  className={`size-6 rounded-md flex items-center justify-center text-[10px] font-bold border transition ${
                    isScheduled
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted/10 border-transparent text-muted-foreground/30'
                  }`}
                  title={wd.label}
                >
                  {dayLetter}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'vendedorLid',
      header: 'Reportado Por',
      render: (item) => (
        <div className="flex flex-col text-xs leading-tight">
          <span className="font-medium text-foreground">{item.vendedor?.nombreReal }</span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Phone className="size-3" />
            {item.vendedor?.telefono}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
    },
  ];

  const handleCreateClick = () => {
    setEditingUbicacion(undefined);
    setIsOpen(true);
  };

  const handleEditClick = (ubi: Ubicacion) => {
    setEditingUbicacion(ubi);
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
      <AppSidebar />
      <SidebarRail />
      <SidebarInset className="flex min-h-svh flex-col bg-transparent">
        <header className="sticky top-2 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background px-4 backdrop-blur-sm rounded-2xl mx-4">
          <SidebarTrigger className="text-muted-foreground" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Ubicaciones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <MapPin className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Gestión de Ubicaciones
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administra las coordenadas reportadas por tus vendedores, asigna códigos SAP, organiza rutas y configura días de visita.
                </p>
              </div>
            </div>
            <Button onClick={handleCreateClick} className="rounded-xl gap-2 h-11 self-start sm:self-auto">
              <PlusCircle className="size-4" />
              Nueva Ubicación
            </Button>
          </div>

          <ReusableTable
            columns={columns}
            data={ubicaciones}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </main>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="sm:max-w-md bg-background border-l border-border overflow-y-auto p-4">
            <SheetHeader className="pb-4 border-b border-border/60">
              <SheetTitle>
                {editingUbicacion ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </SheetTitle>
              <SheetDescription>
                {editingUbicacion
                  ? 'Completa los detalles faltantes del punto reportado.'
                  : 'Rellena el formulario para dar de alta una nueva ubicación de forma manual.'}
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              {editingUbicacion?.urlOriginal && (
                <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enlace de Google Maps Reportado:
                  </div>
                  <a
                    href={editingUbicacion.urlOriginal}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-medium hover:underline break-all block"
                  >
                    {editingUbicacion.urlOriginal}
                  </a>
                </div>
              )}

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
                          Nombre del Cliente / Sucursal
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Ej. Supermercado Ramos"
                          className="rounded-xl px-4 py-3 bg-card"
                        />
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field
                    name="SAP"
                    validators={{
                      onChange: ({ value }) => {
                        const res = z.string().min(1, 'El código SAP es requerido').safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name} required>
                          Código SAP (Ferrero)
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Ej. 123456"
                          className="rounded-xl px-4 py-3 bg-card font-mono"
                        />
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field
                    name="latitud"
                    validators={{
                      onChange: ({ value }) => {
                        const res = z.number().min(-90).max(90).safeParse(Number(value));
                        return res.success ? undefined : 'Latitud debe ser un número entre -90 y 90';
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup>
                        <FieldLabel htmlFor={field.name} required>
                          Latitud
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="any"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                          className="rounded-xl px-4 py-3 bg-card font-mono"
                        />
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field
                    name="longitud"
                    validators={{
                      onChange: ({ value }) => {
                        const res = z.number().min(-180).max(180).safeParse(Number(value));
                        return res.success ? undefined : 'Longitud debe ser un número entre -180 y 180';
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup>
                        <FieldLabel htmlFor={field.name} required>
                          Longitud
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="any"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                          className="rounded-xl px-4 py-3 bg-card font-mono"
                        />
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field name="rutaId">
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name}>
                          Asignar a Ruta
                        </FieldLabel>
                        <select
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onChange={(e) => field.handleChange(e.target.value || '')}
                          className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                        >
                          <option value="">Sin ruta asignada</option>
                          {routeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field name="diasVisita">
                    {(field) => {
                      const selectedDays = field.state.value || [];
                      return (
                        <FieldGroup className="sm:col-span-2">
                          <FieldLabel>Frecuencia / Días de Visita</FieldLabel>
                          <div className="flex flex-wrap gap-2">
                            {weekdays.map((wd) => {
                              const isChecked = selectedDays.includes(wd.value);
                              return (
                                <label
                                  key={wd.value}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                                    isChecked
                                      ? 'bg-primary/10 border-primary text-primary'
                                      : 'bg-card border-input hover:bg-muted/40 text-muted-foreground'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.handleChange([...selectedDays, wd.value]);
                                      } else {
                                        field.handleChange(selectedDays.filter((d) => d !== wd.value));
                                      }
                                    }}
                                    className="size-3.5 rounded border-border text-primary focus:ring-primary"
                                  />
                                  {wd.label}
                                </label>
                              );
                            })}
                          </div>
                        </FieldGroup>
                      );
                    }}
                  </form.Field>

                  <form.Field name="vendedorLid" >
                    {(field) => (
                      <FieldGroup className='sm:col-span-2'>
                        <FieldLabel htmlFor={field.name}>
                          Vendedor
                        </FieldLabel>
                        <select
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="rounded-xl  w-full px-4 py-3 bg-card border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary "
                        >
                          <option value="">Sin Vendedor</option>
                          {vendedorOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
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
                        ) : editingUbicacion ? (
                          'Guardar Cambios'
                        ) : (
                          'Crear Ubicación'
                        )}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación de la ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará el punto reportado permanentemente del sistema de rutas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar Ubicación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
