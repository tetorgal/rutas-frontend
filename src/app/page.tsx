'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  useUbicaciones, 
  useRutas, 
  vendedorApi, 
  solicitudApi 
} from '@/hooks/useApi';
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Circle, 
  MapPin, 
  Route, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

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
  
  // Data Fetching
  const { data: ubicaciones = [], isLoading: cargandoUbicaciones } = useUbicaciones();
  const { data: rutas = [], isLoading: cargandoRutas } = useRutas();
  const { data: vendedores = [] } = vendedorApi.useGetAll();
  const { data: solicitudes = [] } = solicitudApi.useGetAll();

  // WhatsApp bot live connection status
  const [botStatus, setBotStatus] = useState({ estado: 'Cargando...', qr: null });

  useEffect(() => {
    const fetchStatus = () => {
      fetch('http://localhost:5200/whatsapp/status')
        .then(res => res.json())
        .then(data => setBotStatus(data))
        .catch(() => setBotStatus({ estado: 'DESCONECTADO', qr: null }));
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filters State for Live Map
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
    if (selectedRouteId && ubi.rutaId !== selectedRouteId) {
      return false;
    }
    if (selectedDays.length > 0) {
      const ubiDays = ubi.diasVisita || [];
      const hasMatch = selectedDays.some((day) => (ubiDays as string[]).includes(day));
      if (!hasMatch) return false;
    }
    return true;
  });

  // KPI Calculations
  const activeSellersCount = vendedores.filter(v => v.activo).length;
  const pendingRequests = solicitudes.filter(s => s.estado === 'PENDIENTE');

  // Locations per route calculation
  const getLocationsCountForRoute = (routeId: string) => {
    return ubicaciones.filter(u => u.rutaId === routeId).length;
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4 max-w-8xl w-full mx-auto animate-in fade-in duration-300">
      
      {/* 1. Header Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel Principal
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen en tiempo real del levantamiento de rutas, vendedores y solicitudes de acceso.
          </p>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Total Locations */}
        <Card className="p-4 flex items-center justify-between bg-card border border-border shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Ubicaciones Mapeadas
            </p>
            <p className="text-2xl font-bold text-foreground text-center">
              {cargandoUbicaciones ? '...' : ubicaciones.length}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="size-5" />
          </div>
        </Card>

        {/* Card 2: Total Routes */}
        <Card className="p-4 flex items-center justify-between bg-card border border-border shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Rutas Activas
            </p>
            <p className="text-2xl font-bold text-foreground text-center">
              {cargandoRutas ? '...' : rutas.length}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
            <Route className="size-5" />
          </div>
        </Card>

        {/* Card 3: Active Sellers */}
        <Card className="p-4 flex items-center justify-between bg-card border border-border shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Vendedores Activos
            </p>
            <p className="text-2xl font-bold text-foreground text-center">
              {activeSellersCount} <span className="text-xs text-muted-foreground font-normal">/ {vendedores.length}</span>
            </p>
          </div>
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
        </Card>

        {/* Card 4: Pending Waitlist */}
        <Link href="/solicitudes" className="block">
          <Card className="p-4 flex items-center justify-between bg-card border border-border hover:border-primary/50 transition-colors shadow-sm h-full">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Solicitudes de Acceso
              </p>
              <p className="text-2xl font-bold text-foreground text-center">
                {pendingRequests.length}
              </p>
            </div>
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              pendingRequests.length > 0 
                ? 'bg-rose-500/10 text-rose-500 animate-pulse' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="size-5" />
            </div>
          </Card>
        </Link>
      </div>

      {/* 3. Main Dashboard Section Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: WhatsApp Connection status & Route stats */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* WhatsApp Bot Connection Status Card */}
          <Card className="p-6 bg-card border border-border shadow-sm flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Activity className="size-4 text-primary" />
                  Bot de WhatsApp
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estatus en tiempo real del bot de recolección.
                </p>
              </div>
              <Link href="/configuracion">
                <Button variant="ghost" size="sm" className="size-8 p-0 rounded-lg">
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-4">
              {botStatus.estado === 'CONECTADO' ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                    <Wifi className="size-5" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      EN LÍNEA
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">Listo para capturar coordenadas.</p>
                  </div>
                </div>
              ) : botStatus.estado === 'ESPERANDO_QR' ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    <Wifi className="size-5" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      ESPERANDO QR
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">Escanea el QR en la configuración.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
                    <WifiOff className="size-5" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                      DESCONECTADO
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">⚠️ El bot no está respondiendo.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Route Activity/Insights Card */}
          <Card className="p-6 bg-card border border-border shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Distribución de Puntos</h3>
              <p className="text-xs text-muted-foreground">Concentración de ubicaciones por ruta.</p>
            </div>
            
            <div className="space-y-4">
              {cargandoRutas ? (
                <div className="text-center py-6 text-xs text-muted-foreground animate-pulse">
                  Cargando información de rutas...
                </div>
              ) : rutas.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center italic">
                  Aún no hay rutas creadas en el sistema.
                </p>
              ) : (
                rutas.map((ruta) => {
                  const count = getLocationsCountForRoute(ruta.id);
                  const percentage = ubicaciones.length > 0 ? (count / ubicaciones.length) * 100 : 0;
                  return (
                    <div key={ruta.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <Circle 
                            className="size-3 border border-black/10 dark:border-white/10 rounded-full shrink-0" 
                            style={{ fill: ruta.colorHex, color: ruta.colorHex }} 
                          />
                          {ruta.nombre}
                        </span>
                        <span className="font-medium text-muted-foreground font-mono">
                          {count} pts <span className="text-[10px] text-muted-foreground/60">({Math.round(percentage)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: ruta.colorHex, 
                            width: `${percentage}%` 
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
          
          {/* Waitlist quick access if pending */}
          {pendingRequests.length > 0 && (
            <Card className="p-6 bg-card border border-rose-500/10 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  Solicitudes Pendientes
                </h3>
                <Link href="/solicitudes" className="text-[10px] uppercase font-bold text-primary hover:underline">
                  Ver Todas
                </Link>
              </div>

              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div key={req.lid} className="flex justify-between items-center p-2.5 bg-muted/40 border border-border/60 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{req.nombreWa || 'WhatsApp User'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{req.lid}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-semibold">
                      Pendiente
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* Right Column: Live Map */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="relative h-full min-h-[500px] overflow-hidden p-0 shadow-md border border-border rounded-2xl flex flex-col">
            
            {/* Map Loading State */}
            {cargandoUbicaciones && (
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
                className="bg-transparent border-0 font-semibold text-xs rounded-xl px-2 py-1.5 focus:ring-0 focus-visible:outline-none cursor-pointer max-w-44 text-foreground"
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

            <div className="flex-1 w-full h-full relative min-h-[500px]">
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
                          <div className="mb-1 rounded bg-background text-foreground px-2 py-1 text-xs font-bold opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
                            {ubi.nombre} 
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
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}