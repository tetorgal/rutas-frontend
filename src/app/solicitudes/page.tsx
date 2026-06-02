'use client';

import React, { useState } from 'react';
import { solicitudApi, useRutas, Solicitud } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
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
import { ReusableForm, FormFieldConfig } from '@/components/shared/ReusableForm';

interface ApprovalFormData {
  nombreReal: string;
  telefono: string;
  rutaActualId?: string;
}

export default function SolicitudesWaitlistPage() {
  const { data: solicitudes = [], isLoading: isLoadingSolicitudes } = solicitudApi.useGetAll();
  const { data: rutas = [] } = useRutas();

  const aprobarMutation = solicitudApi.useAprobar();
  const rechazarMutation = solicitudApi.useRechazar();
  const eliminarMutation = solicitudApi.useDelete();

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  const routeOptions = rutas.map((r) => ({
    label: r.nombre,
    value: r.id,
  }));

  const handleApproveClick = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setIsApproveOpen(true);
  };

  const handleConfirmApproval = async (formData: ApprovalFormData) => {
    if (!selectedSolicitud) return;
    try {
      await aprobarMutation.mutateAsync({
        lid: selectedSolicitud.lid,
        nombreReal: formData.nombreReal,
        telefono: formData.telefono,
        rutaActualId: formData.rutaActualId || undefined,
      });
      setIsApproveOpen(false);
      setSelectedSolicitud(null);
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Error al aprobar la solicitud');
    }
  };

  const handleRejectClick = async (lid: string) => {
    if (confirm('¿Estás seguro de que deseas rechazar esta solicitud? El vendedor será marcado como inactivo.')) {
      try {
        await rechazarMutation.mutateAsync(lid);
      } catch (err) {
        const error = err as Error;
        alert(error.message || 'Error al rechazar la solicitud');
      }
    }
  };

  const handleDeleteClick = async (lid: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta solicitud de la lista de espera?')) {
      try {
        await eliminarMutation.mutateAsync(lid);
      } catch (err) {
        const error = err as Error;
        alert(error.message || 'Error al eliminar la solicitud');
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
            <div className='gap-2 flex'>
              <Button
                variant="outline"
                size="sm"
                className="h-8 cursor-pointer rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                onClick={() => handleApproveClick(item)}
              >
                <UserCheck className="size-4 mr-1" />
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg cursor-pointer bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-400 border-rose-500/20"
                onClick={() => handleRejectClick(item.lid)}
              >
                <UserX className="size-4 mr-1" />
                Rechazar
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg cursor-pointer border-destructive/20 hover:bg-destructive/10"
            onClick={() => handleDeleteClick(item.lid)}
            title="Eliminar registro"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Config for the approval form
  const approvalFormFields: FormFieldConfig<ApprovalFormData>[] = [
    {
      name: 'nombreReal',
      label: 'Nombre Completo del Vendedor',
      type: 'text',
      placeholder: 'Ej. Juan Pérez',
      required: true,
    },
    {
      name: 'telefono',
      label: 'Número de Teléfono',
      type: 'text',
      placeholder: 'Ej. 6181234567',
      required: true,
    },
    {
      name: 'rutaActualId',
      label: 'Ruta Asignada (Opcional)',
      type: 'select',
      placeholder: 'Selecciona una ruta',
      options: routeOptions,
    },
  ];

  const approvalInitialData: Partial<ApprovalFormData> = {
    nombreReal: selectedSolicitud?.nombreWa || '',
    telefono: selectedSolicitud?.lid || '',
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
          <SheetContent side="right" className="sm:max-w-md bg-background border-l border-border">
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
              <ReusableForm
                fields={approvalFormFields}
                initialData={approvalInitialData}
                onSubmit={handleConfirmApproval}
                onCancel={() => setIsApproveOpen(false)}
                submitLabel="Confirmar y Autorizar"
                isSubmitting={aprobarMutation.isPending}
              />
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </>
  );
}
