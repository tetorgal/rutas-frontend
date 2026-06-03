'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeNames: Record<string, string> = {
  'vendedores': 'Vendedores',
  'rutas': 'Rutas',
  'ubicaciones': 'Ubicaciones',
  'solicitudes': 'Solicitudes',
  'configuracion': 'Configuración',
  'herramientas': 'Herramientas',
};

export function AppHeader() {
  const pathname = usePathname();
  
  // Split path into segments
  const segments = pathname.split('/').filter(Boolean);
  
  return (
    <header className="sticky top-2 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background px-4 backdrop-blur-sm rounded-2xl mx-4">
      <SidebarTrigger className="text-muted-foreground" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {segments.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>Mapa en vivo</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join('/')}`;
              const isLast = index === segments.length - 1;
              const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
              
              return (
                <React.Fragment key={href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
