'use client';

import React, { useState } from 'react';
import { vendedorApi, Vendedor, useRutas } from '@/hooks/useApi';
import { ReusableTable, Column } from '@/components/shared/ReusableTable';
import { ReusableForm, FormFieldConfig } from '@/components/shared/ReusableForm';
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
import { UserPlus, Users, CheckCircle, XCircle, Route } from 'lucide-react';

export default function VendedoresPage() {
  const { data: vendedores = [], isLoading } = vendedorApi.useGetAll();
  const { data: rutas = [] } = useRutas();

  const createMutation = vendedorApi.useCreate();
  const updateMutation = vendedorApi.useUpdate();
  const deleteMutation = vendedorApi.useDelete();

  const [isOpen, setIsOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | undefined>(undefined);

  // Map routes for the select dropdown
  const routeOptions = rutas.map((r) => ({
    label: r.nombre,
    value: r.id,
  }));

  const fields: FormFieldConfig<Vendedor>[] = [
    {
      name: 'lid',
      label: 'ID de WhatsApp / LID (Ej. número de teléfono)',
      type: 'text',
      placeholder: 'Ej. 5216183951156',
      required: true,
    },
    {
      name: 'nombreReal',
      label: 'Nombre completo',
      type: 'text',
      placeholder: 'Ej. Juan Pérez',
      required: true,
    },
    {
      name: 'telefono',
      label: 'Teléfono de contacto (Opcional)',
      type: 'tel',
      placeholder: 'Ej. 6181234567',
    },
    {
      name: 'rutaActualId',
      label: 'Ruta Asignada',
      type: 'select',
      placeholder: 'Selecciona una ruta',
      options: routeOptions,
    },
    {
      name: 'activo',
      label: 'Vendedor activo (Autorizado para reportar ubicaciones)',
      type: 'checkbox',
    },
  ];

  // Adjust fields if editing (disable JID/LID editing since it's the primary key)
  const formFields = editingVendedor
    ? fields.map((f) => (f.name === 'lid' ? { ...f, required: false, placeholder: editingVendedor.lid } : f))
    : fields;

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

  const handleDeleteClick = async (lid: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este vendedor?')) {
      try {
        await deleteMutation.mutateAsync(lid);
      } catch (err) {
        const error = err as Error;
        alert(error.message || 'Error al eliminar el vendedor');
      }
    }
  };

  const handleSubmit = async (data: Vendedor) => {
    try {
      if (editingVendedor) {
        // Enforce using the original lid when editing
        const updateData = {
          ...data,
          lid: editingVendedor.lid,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsOpen(false);
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Error al guardar el vendedor');
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
                <BreadcrumbPage>Vendedores</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

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
          <SheetContent side="right" className="sm:max-w-md bg-background border-l border-border">
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
              <ReusableForm
                fields={formFields}
                initialData={editingVendedor}
                onSubmit={handleSubmit}
                onCancel={() => setIsOpen(false)}
                submitLabel={editingVendedor ? 'Guardar Cambios' : 'Crear Vendedor'}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </>
  );
}
