'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useUbicaciones } from '@/hooks/useApi';
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { Card } from '@/components/ui/card';
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
import { MapPin } from 'lucide-react';

function MapLabelTuner() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const applyLabels = () => {
      const layers = map.getStyle().layers ?? [];

      layers.forEach((layer) => {
        if (layer.type !== 'symbol') return;
        const layout = layer.layout as { 'text-field'?: unknown } | undefined;
        if (!layout || !layout['text-field']) return;

        try {
          map.setLayoutProperty(layer.id, 'text-size', [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            12,
            10,
            14,
            13,
            16,
            17,
            20,
          ]);
          map.setPaintProperty(
            layer.id,
            'text-halo-color',
            'rgba(165, 165, 165, 0.9)',
          );
          map.setPaintProperty(layer.id, 'text-halo-width', 1.2);
        } catch {
          // Some layers may not allow runtime overrides.
        }
      });
    };

    applyLabels();
    map.on('style.load', applyLabels);

    return () => {
      map.off('style.load', applyLabels);
    };
  }, [map, isLoaded]);

  return null;
}

export default function SupervisorDashboard() {
  const { theme, resolvedTheme } = useTheme();
  const { data: ubicaciones = [], isLoading: cargando } = useUbicaciones();
  const defaultCenter: [number, number] = [-104.6901381, 24.0080354];
  const mapCenter: [number, number] = ubicaciones.length
    ? [ubicaciones[0].longitud, ubicaciones[0].latitud]
    : defaultCenter;

  return (
    <>
      <AppSidebar   />
      <SidebarRail />
      <SidebarInset className="flex min-h-svh flex-col bg-transparent">
        <header className="sticky top-2 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background px-4 backdrop-blur-sm rounded-2xl mx-4">
          <SidebarTrigger className="text-muted-foreground" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Rutas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Mapa en vivo</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* <div className="ml-auto hidden items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs text-muted-foreground shadow-sm sm:flex">
            Actualizado hace 2 min
            <span className="inline-flex size-2 rounded-full bg-emerald-400" />
          </div> */}
        </header>

        <main className="flex flex-1 flex-col gap-2 p-2 sm:p-4">
          <div className="flex flex-1 flex-col">
            <Card className="relative h-full min-h-105 overflow-hidden p-0 shadow-lg">
              {cargando && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando mapa y ubicaciones...</p>
                  </div>
                </div>
              )}
              <Map
                key={mapCenter.join(',')}
                center={mapCenter}
                zoom={12}
                theme={(theme === 'system' ? resolvedTheme : theme) as 'light' | 'dark' | 'goal'}
              >
                <MapControls />
                <MapLabelTuner />
                {ubicaciones.map((ubi) => (
                  <MapMarker
                    key={ubi.id}
                    longitude={ubi.longitud}
                    latitude={ubi.latitud}
                  >
                    <MarkerContent className="group">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-1 rounded bg-white px-2 py-1 text-xs font-bold opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                          {ubi.nombre}
                        </div>
                        <div>
                          <MapPin
                            className="h-5 w-5 text-sidebar-primary"
                              fill='red'
                            focusable
                          />
                        </div>
                      </div>
                    </MarkerContent>
                  </MapMarker>
                ))}
              </Map>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}