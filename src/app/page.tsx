'use client';

import { useEffect, useState } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Definimos la interfaz basada en tu modelo de Prisma
interface Ubicacion {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  nombreVendedor: string;
  urlOriginal: string;
}

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
            'rgba(255, 255, 255, 0.9)',
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
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const defaultCenter: [number, number] = [-104.6901381, 24.0080354];
  const mapCenter: [number, number] = ubicaciones.length
    ? [ubicaciones[0].longitud, ubicaciones[0].latitud]
    : defaultCenter;

  useEffect(() => {
    // Llamada a tu backend en NestJS
    fetch('http://localhost:3000/ubicaciones')
      .then((res) => res.json())
      .then((data) => {
        setUbicaciones(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error('Error al cargar ubicaciones:', err);
        setCargando(false);
      });
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans">
      
      {/* Sidebar - Lista de Puntos */}
      <aside className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Rutas Chocolates SA</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ubicaciones.length} ubicaciones capturadas hoy
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cargando ? (
            <p className="text-center text-gray-400 mt-10 animate-pulse">Cargando puntos...</p>
          ) : (
            ubicaciones.map((ubi) => (
              <div key={ubi.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-gray-800">{ubi.nombre}</h3>
                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                  <span>👤 {ubi.nombreVendedor}</span>
                  <a 
                    href={ubi.urlOriginal} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Ver en Maps
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botón de Exportar (Estructura para la Fase 2) */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button className="w-full bg-black text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">
            Exportar para My Maps (CSV)
          </button>
        </div>
      </aside>

      {/* Área del Mapa */}
      <main className="flex-1 relative p-6">
        <Card className="h-full p-0 overflow-hidden">
          <Map key={mapCenter.join(',')} center={mapCenter} zoom={12} theme="light">
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
                    <div className="bg-white text-xs font-bold px-2 py-1 rounded shadow-md mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-200">
                      {ubi.nombre}
                    </div>
                    <div className="rounded-full bg-white p-1.5 shadow-lg ring-1 ring-black/10">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            ))}
          </Map>
        </Card>
      </main>

    </div>
  );
}