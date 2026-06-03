'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import { Settings } from 'lucide-react';

export default function PanelWhatsapp() {
  const [estadoBot, setEstadoBot] = useState({ estado: 'Cargando...', qr: null });

  useEffect(() => {
    // Hacemos una consulta (Polling) cada 3 segundos
    const intervalo = setInterval(() => {
      fetch('http://localhost:5200/whatsapp/status')
        .then(res => res.json())
        .then(data => setEstadoBot(data))
        .catch(() => console.error("Error al conectar con el servidor"));
    }, 3000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Configuración
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra la conexión de WhatsApp y otras opciones de la plataforma.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border shadow-sm text-center max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-foreground mb-4">Conexión WhatsApp</h2>
        
        {estadoBot.estado === 'CONECTADO' && (
          <div className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 p-4 rounded-xl font-semibold border border-emerald-500/20">
            El sistema está en línea y operando.
          </div>
        )}

        {estadoBot.estado === 'ESPERANDO_QR' && estadoBot.qr && (
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-6">
              Escanea este código con el teléfono que servirá como número supervisor.
            </p>
            <div className="p-4 bg-white border border-border rounded-xl shadow-sm inline-block">
              <QRCodeSVG value={estadoBot.qr} size={200} />
            </div>
          </div>
        )}

        {estadoBot.estado === 'DESCONECTADO' && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl font-semibold border border-destructive/20">
            ⚠️ El bot está desconectado.
          </div>
        )}

        {estadoBot.estado === 'Cargando...' && (
          <div className="text-sm text-muted-foreground py-4 animate-pulse">
            Consultando estado del servidor...
          </div>
        )}
      </div>
    </main>
  );
}