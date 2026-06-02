'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { solicitudApi, useRutas, Solicitud } from '@/hooks/useApi';
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
import {
  UserCheck,
  UserX,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ReusableTable, Column } from '@/components/shared/ReusableTable';
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

export default function SolicitudesWaitlistPage() {
  const { data: solicitudes = [], isLoading: isLoadingSolicitudes } = solicitudApi.useGetAll();
  const { data: rutas = [] } = useRutas();

  const aprobarMutation = solicitudApi.useAprobar();
  const rechazarMutation = solicitudApi.useRechazar();
  const eliminarMutation = solicitudApi.useDelete();

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  // AlertDialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    actionText: string;
    action: () => Promise<void>;
  } | null>(null);

  const routeOptions = rutas.map((r) => ({
    label: r.nombre,
    value: r.id,
  }));

  // Define TanStack Form for Approval
  const form = useForm({
    defaultValues: {
      nombreReal: '',
      telefono: '',
      rutaActualId: '',
    },
    onSubmit: async ({ value }) => {
      if (!selectedSolicitud) return;
      try {
        await aprobarMutation.mutateAsync({
          lid: selectedSolicitud.lid,
          nombreReal: value.nombreReal,
          telefono: value.telefono,
          rutaActualId: value.rutaActualId || undefined,
        });
        setIsApproveOpen(false);
        setSelectedSolicitud(null);
      } catch {
        // Handled globally
      }
    },
  });

  // Sync selected solicitud details to form inputs
  useEffect(() => {
    if (isApproveOpen) {
      if (selectedSolicitud) {
        form.setFieldValue('nombreReal', selectedSolicitud.nombreWa || '');
        form.setFieldValue('telefono', selectedSolicitud.lid || '');
        form.setFieldValue('rutaActualId', '');
      } else {
        form.reset();
      }
    }
  }, [selectedSolicitud, isApproveOpen, form]);

  const handleApproveClick = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setIsApproveOpen(true);
  };

  const handleRejectClick = (lid: string) => {
    setConfirmConfig({
      title: '¿Rechazar solicitud?',
      description: 'Esta acción marcará la solicitud como rechazada y desactivará al vendedor si existe en el sistema.',
      actionText: 'Rechazar Solicitud',
      action: async () => {
        await rechazarMutation.mutateAsync(lid);
      },
    });
    setConfirmOpen(true);
  };

  const handleDeleteClick = (lid: string) => {
    setConfirmConfig({
      title: '¿Eliminar de la lista de espera?',
      description: 'Esta acción removerá permanentemente el registro de la sala de espera.',
      actionText: 'Eliminar Registro',
      action: async () => {
        await eliminarMutation.mutateAsync(lid);
      },
    });
    setConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (confirmConfig) {
      try {
        await confirmConfig.action();
      } catch {
        // Handled globally
      } finally {
        setConfirmConfig(null);
      }
    }
  };

  const pendingSolicitudesCount = solicitudes.filter((s) => s.estado === 'PENDIENTE').length;

  const columns: Column<Solicitud>[] = [
    {
      key: 'lid',
      header: 'LID / Número',
      render: (item) => (
        <span className="font-mono text-xs flex items-center gap-1.5">
          <Phone className="size-3.5 text-muted-foreground" />
          {item.lid}
        </span>
      ),
    },
    {
      key: 'nombreWa',
      header: 'Nombre en WhatsApp',
      render: (item) => (
        <span className="font-medium text-foreground">
          {item.nombreWa || <span className="text-muted-foreground text-xs italic">No especificado</span>}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha de Contacto',
      render: (item) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {new Date(item.fecha).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => {
        let badgeStyle = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        let icon = <Clock className="size-3.5" />;

        if (item.estado === 'APROBADO') {
          badgeStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
          icon = <CheckCircle className="size-3.5" />;
        } else if (item.estado === 'RECHAZADO') {
          badgeStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
          icon = <XCircle className="size-3.5" />;
        }

        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
            {icon}
            {item.estado}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones de Waitlist',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.estado === 'PENDIENTE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                onClick={() => handleApproveClick(item)}
              >
                <UserCheck className="size-4 mr-1" />
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-400 border-rose-500/20"
                onClick={() => handleRejectClick(item.lid)}
              >
                <UserX className="size-4 mr-1" />
                Rechazar
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-destructive/20 hover:bg-destructive/10"
            onClick={() => handleDeleteClick(item.lid)}
            title="Eliminar registro"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

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
                <BreadcrumbPage>Solicitudes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Clock className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Sala de Espera (Waitlist)
                  {pendingSolicitudesCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 text-xs font-semibold animate-pulse">
                      {pendingSolicitudesCount} pendientes
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Números de WhatsApp desconocidos detectados por el bot. Apruébalos para agregarlos como vendedores.
                </p>
              </div>
            </div>
          </div>

          <ReusableTable
            columns={columns}
            data={solicitudes}
            isLoading={isLoadingSolicitudes}
          />
        </main>

        <Sheet open={isApproveOpen} onOpenChange={setIsApproveOpen}>
          <SheetContent side="right" className="sm:max-w-md bg-background border-l border-border overflow-y-auto p-4">
            <SheetHeader className="pb-4 border-b border-border/60">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-yellow-500" />
                Registrar Vendedor Autorizado
              </SheetTitle>
              <SheetDescription>
                Completa los datos para dar de alta al vendedor en el sistema y autorizar su acceso desde WhatsApp.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              {selectedSolicitud && (
                <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Datos detectados por el Bot:
                  </div>
                  <div className="text-sm grid grid-cols-3 gap-1">
                    <span className="text-muted-foreground">WhatsApp ID:</span>
                    <span className="col-span-2 font-mono font-medium">{selectedSolicitud.lid}</span>
                    <span className="text-muted-foreground">Push Name:</span>
                    <span className="col-span-2 font-medium">{selectedSolicitud.nombreWa || 'Sin nombre'}</span>
                  </div>
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
                          Nombre Completo del Vendedor
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

                  <form.Field
                    name="telefono"
                    validators={{
                      onChange: ({ value }) => {
                        const res = z.string().min(1, 'El teléfono es requerido').safeParse(value);
                        return res.success ? undefined : res.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name} required>
                          Número de Teléfono
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
                        {field.state.meta.errors ? (
                          <p className="text-xs text-rose-500 font-medium">{field.state.meta.errors.join(', ')}</p>
                        ) : null}
                      </FieldGroup>
                    )}
                  </form.Field>

                  <form.Field name="rutaActualId">
                    {(field) => (
                      <FieldGroup className="sm:col-span-2">
                        <FieldLabel htmlFor={field.name}>
                          Ruta Asignada (Opcional)
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
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsApproveOpen(false)}
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
                        {isSubmitting || aprobarMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Guardando...
                          </div>
                        ) : (
                          'Confirmar y Autorizar'
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmConfig?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {confirmConfig?.actionText || 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
