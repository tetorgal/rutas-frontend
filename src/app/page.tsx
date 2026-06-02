'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useUbicaciones, useRutas } from '@/hooks/useApi';
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
import { Circle } from 'lucide-react';

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
          // Some layers may not allow overrides.
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
  const { data: rutas = [] } = useRutas();

  // Filters State
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const defaultCenter: [number, number] = [-104.6901381, 24.0080354];
  const mapCenter: [number, number] = ubicaciones.length
    ? [ubicaciones[0].longitud, ubicaciones[0].latitud]
    : defaultCenter;

  const weekdays = [
    { key: 'L', value: 'LUNES', label: 'Lunes' },
    { key: 'M', value: 'MARTES', label: 'Martes' },
    { key: 'X', value: 'MIERCOLES', label: 'Miércoles' },
    { key: 'J', value: 'JUEVES', label: 'Jueves' },
    { key: 'V', value: 'VIERNES', label: 'Viernes' },
    { key: 'S', value: 'SABADO', label: 'Sábado' },
  ];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Filter reported locations
  const filteredUbicaciones = ubicaciones.filter((ubi) => {
    // 1. Route filter
    if (selectedRouteId && ubi.rutaId !== selectedRouteId) {
      return false;
    }
    // 2. Day of visit filter
    if (selectedDays.length > 0) {
      const ubiDays = ubi.diasVisita || [];
      const hasMatch = selectedDays.some((day) => (ubiDays as string[]).includes(day));
      if (!hasMatch) return false;
    }
    return true;
  });

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
                <BreadcrumbLink href="/">Rutas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Mapa en vivo</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
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

              {/* Floating Operative Filters */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-background/95 backdrop-blur-sm p-2 rounded-2xl border border-border shadow-md max-w-[calc(100%-2rem)]">
                {/* Route Selector */}
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="bg-transparent border-0 font-medium text-xs rounded-xl px-2 py-1.5 focus:ring-0 focus-visible:outline-none cursor-pointer max-w-44 text-foreground"
                >
                  <option value="">Todas las rutas</option>
                  {rutas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                <div className="h-4 w-px bg-border hidden sm:block" />
                
                {/* Weekday Buttons */}
                <div className="flex items-center gap-1">
                  {weekdays.map((wd) => {
                    const isActive = selectedDays.includes(wd.value);
                    return (
                      <button
                        key={wd.value}
                        onClick={() => toggleDay(wd.value)}
                        className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                            : 'bg-muted/40 hover:bg-muted/80 text-muted-foreground border-transparent'
                        }`}
                        title={`Filtrar por ${wd.label}`}
                      >
                        {wd.key}
                      </button>
                    );
                  })}
                </div>

                {(selectedDays.length > 0 || selectedRouteId) && (
                  <button
                    onClick={() => {
                      setSelectedRouteId('');
                      setSelectedDays([]);
                    }}
                    className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-600 px-2 py-1"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <Map
                key={mapCenter.join(',')}
                center={mapCenter}
                zoom={12}
                theme={(theme === 'system' ? resolvedTheme : theme) as 'light' | 'dark' | 'goal'}
              >
                <MapControls />
                <MapLabelTuner />
                {filteredUbicaciones.map((ubi) => {
                  const markerColor = ubi.ruta?.colorHex || '#eeff';
                  return (
                    <MapMarker
                      key={ubi.id}
                      longitude={ubi.longitud}
                      latitude={ubi.latitud}
                    >
                      <MarkerContent className="group">
                        <div className="flex flex-col items-center justify-center">
                          <div className="mb-1 rounded bg-background text-foreground px-2 py-1 text-xs font-bold opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                            {ubi.nombre} 
                            {/* ({ubi.SAP}) */}
                          </div>
                          <div>
                            <Circle
                              className="h-6 w-6 filter drop-shadow-md"
                              style={{ color: markerColor }}
                              focusable
                            />
                          </div>
                        </div>
                      </MarkerContent>
                    </MapMarker>
                  );
                })}
              </Map>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}