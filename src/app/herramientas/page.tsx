'use client';

import React, { useState, useRef } from 'react';
import { 
  Wrench, 
  MapPin, 
  ArrowRightLeft, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  Info,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// CSV Parsing Helper Functions
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          entry += '"';
          i++; 
        } else {
          inQuotes = false;
        }
      } else {
        entry += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(entry.trim());
        entry = '';
      } else if (char === '\n' || char === '\r') {
        row.push(entry.trim());
        entry = '';
        if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
          result.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; 
        }
      } else {
        entry += char;
      }
    }
  }
  if (entry || row.length > 0) {
    row.push(entry.trim());
    if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
      result.push(row);
    }
  }
  return result;
}

function arrayToCSV(arr: string[][]): string {
  return arr.map(row => 
    row.map(val => {
      const escaped = (val || '').replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\n');
}

// Extractor Regex Logic
function extractCoordsFromUrl(url: string): { lat: string; lng: string } | null {
  if (!url) return null;
  
  // 1. Check for place/latitude,longitude
  const placeRegex = /place\/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i;
  const placeMatch = url.match(placeRegex);
  if (placeMatch) {
    return { lat: placeMatch[1], lng: placeMatch[2] };
  }

  // 2. Check for @latitude,longitude
  const atRegex = /@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i;
  const atMatch = url.match(atRegex);
  if (atMatch) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }

  // 3. Check for q=latitude,longitude or query=latitude,longitude or ll=latitude,longitude
  const qRegex = /[?&](q|query|ll)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i;
  const qMatch = url.match(qRegex);
  if (qMatch) {
    return { lat: qMatch[2], lng: qMatch[3] };
  }

  // 4. Fallback search for any "lat,lng" pattern in the URL
  const genericCoordsRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const genericMatch = url.match(genericCoordsRegex);
  if (genericMatch) {
    const lat = parseFloat(genericMatch[1]);
    const lng = parseFloat(genericMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: genericMatch[1], lng: genericMatch[2] };
    }
  }

  return null;
}





export default function HerramientasPage() {
  const [activeTab, setActiveTab] = useState<'extractor' | 'enlaces' | 'encuestas'>('extractor');
  
  // Tab 1: Extractor States
  const [inputText, setInputText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [selectedColIndex, setSelectedColIndex] = useState<number>(-1);
  const [extractedResults, setExtractedResults] = useState<{
    originalUrl: string;
    lat: string;
    lng: string;
    status: 'success' | 'failed' | 'empty';
    rowDetails?: string[];
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Link Generator States
  const [singleLat, setSingleLat] = useState('');
  const [singleLng, setSingleLng] = useState('');
  const [bulkCoords, setBulkCoords] = useState('');
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);



  // Tab 5: Levantamiento / Encuestas (Forms Builder from Excel)
  const [surveyHeaders, setSurveyHeaders] = useState<string[]>([]);
  const [surveyRows, setSurveyRows] = useState<string[][]>([]);
  const [surveyFileName, setSurveyFileName] = useState('');
  const [colDiaIdx, setColDiaIdx] = useState<number>(-1);
  const [colRutaIdx, setColRutaIdx] = useState<number>(-1);
  const [colClienteIdx, setColClienteIdx] = useState<number>(-1);
  const [colComentarioIdx, setColComentarioIdx] = useState<number>(-1);

  const [selDia, setSelDia] = useState('');
  const [selRuta, setSelRuta] = useState('');
  const [selCliente, setSelCliente] = useState('');
  const [inputComentario, setInputComentario] = useState('');

  const surveyFileInputRef = useRef<HTMLInputElement>(null);

  // Copy Clipboard feedback helper
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkType(type);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedLinkType(null), 2000);
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setCsvHeaders(parsed[0]);
        setCsvRows(parsed.slice(1));
        // Try to auto-select column containing maps/google urls
        const mapColIndex = parsed[0].findIndex(h => 
          h.toLowerCase().includes('url') || 
          h.toLowerCase().includes('map') || 
          h.toLowerCase().includes('google') ||
          h.toLowerCase().includes('link')
        );
        setSelectedColIndex(mapColIndex !== -1 ? mapColIndex : 0);
        toast.success(`Archivo "${file.name}" cargado exitosamente (${parsed.length - 1} filas).`);
      } else {
        toast.error('El archivo CSV está vacío.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Run CSV Extraction
  const handleExtractCSV = () => {
    if (selectedColIndex === -1 || csvRows.length === 0) {
      toast.error('Por favor, selecciona una columna para extraer.');
      return;
    }

    const results = csvRows.map(row => {
      const url = row[selectedColIndex] || '';
      const coords = extractCoordsFromUrl(url);
      return {
        originalUrl: url,
        lat: coords?.lat || '',
        lng: coords?.lng || '',
        status: coords ? 'success' as const : (url.trim() ? 'failed' as const : 'empty' as const),
        rowDetails: row
      };
    });

    setExtractedResults(results);
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Extracción finalizada: ${successCount} de ${results.length} coordenadas extraídas.`);
  };

  // Download Output CSV
  const downloadExtractedCSV = () => {
    if (extractedResults.length === 0) return;

    // Build new CSV starting with original headers + Latitud + Longitud
    const newHeaders = [...csvHeaders, 'latitud_extraida', 'longitud_extraida', 'estado_extraccion'];
    const newRows = extractedResults.map(res => [
      ...(res.rowDetails || []),
      res.lat,
      res.lng,
      res.status === 'success' ? 'EXITOSO' : (res.status === 'failed' ? 'FALLIDO' : 'VACIO')
    ]);

    const csvContent = arrayToCSV([newHeaders, ...newRows]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'coordenadas_extraidas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Descarga iniciada.');
  };

  // Text Area Extraction
  const handleExtractRawText = () => {
    const urls = inputText.split('\n').filter(line => line.trim());
    if (urls.length === 0) {
      toast.error('Por favor ingresa texto o urls para analizar.');
      return;
    }

    const results = urls.map(url => {
      const coords = extractCoordsFromUrl(url);
      return {
        originalUrl: url,
        lat: coords?.lat || '',
        lng: coords?.lng || '',
        status: coords ? 'success' as const : 'failed' as const
      };
    });

    setExtractedResults(results);
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Extracción finalizada: ${successCount} coordenadas extraídas.`);
  };



  // Link Generation Logic
  const getGoogleMapsSearch = (lat: string, lng: string) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const getWazeLink = (lat: string, lng: string) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const getAppleMapsLink = (lat: string, lng: string) => `https://maps.apple.com/?q=${lat},${lng}`;

  const handleBulkGenerateLinks = () => {
    const lines = bulkCoords.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      toast.error('Ingresa coordenadas para procesar.');
      return;
    }

    const results = lines.map(line => {
      // split by comma or spaces
      const parts = line.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            originalUrl: line,
            lat: lat.toString(),
            lng: lng.toString(),
            status: 'success' as const
          };
        }
      }
      return {
        originalUrl: line,
        lat: '',
        lng: '',
        status: 'failed' as const
      };
    });

    setExtractedResults(results);
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Generados enlaces para ${successCount} coordenadas.`);
  };

  // Tab 5: Encuestas / Levantamientos Helper Functions
  const processSurveyFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        const headers = [...parsed[0]];
        let rows = parsed.slice(1).map(row => [...row]);

        // Check if comments column exists
        let commentIdx = headers.findIndex(h => h.toLowerCase() === 'comentarios' || h.toLowerCase() === 'comentario');
        if (commentIdx === -1) {
          headers.push('Comentarios');
          commentIdx = headers.length - 1;
          // Pad all rows with an empty string for comments
          rows = rows.map(row => {
            const newRow = [...row];
            while (newRow.length < headers.length) {
              newRow.push('');
            }
            return newRow;
          });
        }

        setSurveyHeaders(headers);
        setSurveyRows(rows);
        setSurveyFileName(file.name);

        // Map Dia, Ruta, Cliente columns
        const dia = headers.findIndex(h => h.toLowerCase().includes('dia') || h.toLowerCase().includes('día') || h.toLowerCase().includes('fecha'));
        const ruta = headers.findIndex(h => h.toLowerCase().includes('ruta'));
        const cliente = headers.findIndex(h => h.toLowerCase().includes('cliente') || h.toLowerCase().includes('nombre') || h.toLowerCase().includes('establecimiento'));

        setColDiaIdx(dia !== -1 ? dia : 0);
        setColRutaIdx(ruta !== -1 ? ruta : (headers.length > 1 ? 1 : 0));
        setColClienteIdx(cliente !== -1 ? cliente : (headers.length > 2 ? 2 : 0));
        setColComentarioIdx(commentIdx);

        // Reset form fields
        setSelDia('');
        setSelRuta('');
        setSelCliente('');
        setInputComentario('');
        
        toast.success(`Encuesta "${file.name}" cargada. (${rows.length} registros)`);
      } else {
        toast.error('El archivo está vacío.');
      }
    };
    reader.readAsText(file);
  };

  const handleSurveyFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSurveyFile(files[0]);
    }
  };

  const handleSurveyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSurveyFile(files[0]);
    }
  };

  const getUniqueDias = () => {
    if (colDiaIdx === -1 || surveyRows.length === 0) return [];
    const values = surveyRows.map(row => row[colDiaIdx]).filter(Boolean);
    return Array.from(new Set(values));
  };

  const getUniqueRutas = () => {
    if (colRutaIdx === -1 || surveyRows.length === 0) return [];
    let filtered = surveyRows;
    if (selDia) {
      filtered = filtered.filter(row => row[colDiaIdx] === selDia);
    }
    const values = filtered.map(row => row[colRutaIdx]).filter(Boolean);
    return Array.from(new Set(values));
  };

  const getUniqueClientes = () => {
    if (colClienteIdx === -1 || surveyRows.length === 0) return [];
    let filtered = surveyRows;
    if (selDia) {
      filtered = filtered.filter(row => row[colDiaIdx] === selDia);
    }
    if (selRuta) {
      filtered = filtered.filter(row => row[colRutaIdx] === selRuta);
    }
    const values = filtered.map(row => row[colClienteIdx]).filter(Boolean);
    return Array.from(new Set(values));
  };

  const handleClienteSelectChange = (val: string) => {
    setSelCliente(val);
    const row = surveyRows.find(r => 
      r[colDiaIdx] === selDia && 
      r[colRutaIdx] === selRuta && 
      r[colClienteIdx] === val
    );
    if (row && colComentarioIdx !== -1) {
      setInputComentario(row[colComentarioIdx] || '');
    } else {
      setInputComentario('');
    }
  };

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selDia || !selRuta || !selCliente) {
      toast.error('Por favor selecciona Día, Ruta y Cliente.');
      return;
    }

    const updatedRows = [...surveyRows];
    const rowIdx = updatedRows.findIndex(r => 
      r[colDiaIdx] === selDia && 
      r[colRutaIdx] === selRuta && 
      r[colClienteIdx] === selCliente
    );

    if (rowIdx !== -1) {
      updatedRows[rowIdx][colComentarioIdx] = inputComentario;
      setSurveyRows(updatedRows);
      toast.success(`Comentario guardado para "${selCliente}".`);
    } else {
      toast.error('No se pudo encontrar el registro coincidente.');
    }
  };

  const getRowsWithComments = () => {
    if (colComentarioIdx === -1 || surveyRows.length === 0) return [];
    return surveyRows.filter(row => row[colComentarioIdx] && row[colComentarioIdx].trim() !== '');
  };

  const downloadSurveyCSV = () => {
    if (surveyRows.length === 0) return;
    const csvContent = arrayToCSV([surveyHeaders, ...surveyRows]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `encuesta_${surveyFileName || 'resultados.csv'}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Resultados exportados con éxito.');
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Wrench className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Herramientas de Geolocalización
            </h1>
            <p className="text-sm text-muted-foreground">
              Utilidades útiles para estructurar, validar y convertir datos geográficos y rutas.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => { setActiveTab('extractor'); setExtractedResults([]); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'extractor'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet className="size-4" />
          Extractor de Enlaces Google Maps
        </button>
        <button
          onClick={() => { setActiveTab('enlaces'); setExtractedResults([]); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'enlaces'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="size-4" />
          Generador de Enlaces de Navegación
        </button>
        <button
          onClick={() => { setActiveTab('encuestas'); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'encuestas'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="size-4" />
          Levantamiento / Formularios (CSV)
        </button>
      </div>

      {/* Tab Contents */}
      <div className="grid gap-6">
        
        {/* Tab 1: Extractor */}
        {activeTab === 'extractor' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Drag and Drop Zone */}
              <Card className="p-6 border border-dashed border-border/80 hover:border-primary/50 transition-colors bg-card/50">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center text-center p-4 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-10 text-muted-foreground mb-3 animate-bounce" />
                  <h3 className="font-semibold text-foreground text-sm mb-1">Cargar Archivo Excel / CSV</h3>
                  <p className="text-xs text-muted-foreground max-w-56 mb-4">
                    Arrastra y suelta tu archivo exportado de rutas aquí o haz clic para buscar.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                  <Button size="sm" variant="outline" className="rounded-xl">
                    Seleccionar Archivo
                  </Button>
                </div>
              </Card>

              {/* Text Input Option */}
              <Card className="p-6 bg-card flex flex-col gap-4">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  O pegar Texto / Enlaces sueltos
                </h3>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Pega texto aquí que contenga URLs de Google Maps de cualquier formato (uno por línea)..."
                  className="w-full min-h-32 bg-background border border-input rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                />
                <Button onClick={handleExtractRawText} className="rounded-xl w-full">
                  Analizar Texto
                </Button>
              </Card>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* CSV Columns Mapping Configuration */}
              {csvHeaders.length > 0 && (
                <Card className="p-6 bg-card flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-foreground text-sm">Configuración de Columnas</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setCsvHeaders([]); setCsvRows([]); setExtractedResults([]); }}
                      className="text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <Trash2 className="size-4 mr-1" />
                      Limpiar Archivo
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Columna con Google Maps URL:
                    </label>
                    <select
                      value={selectedColIndex}
                      onChange={(e) => setSelectedColIndex(parseInt(e.target.value))}
                      className="bg-background border border-input rounded-xl px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer w-full sm:w-64"
                    >
                      {csvHeaders.map((header, idx) => (
                        <option key={idx} value={idx}>
                          {header || `Columna ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleExtractCSV} size="sm" className="rounded-xl ml-auto">
                      Procesar Columna
                    </Button>
                  </div>
                </Card>
              )}

              {/* Informative Note */}
              <Card className="p-4 bg-muted/40 border border-border rounded-xl flex gap-3 text-xs text-muted-foreground leading-relaxed">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">Acerca de Enlaces Acortados (maps.app.goo.gl)</p>
                  Los enlaces acortados requieren conectividad a internet para seguir el redireccionamiento y extraer las coordenadas. El extractor soporta la extracción instantánea local de enlaces completos (ej. que contengan <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">@24.00,-104.69</code> o <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">place/24.00,-104.69</code>).
                </div>
              </Card>

              {/* Extraction Results Preview */}
              {extractedResults.length > 0 && (
                <Card className="p-6 bg-card flex flex-col gap-4 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Vista Previa de Coordenadas Extraídas</h3>
                      <p className="text-xs text-muted-foreground">
                        Se extrajeron correctamente {extractedResults.filter(r => r.status === 'success').length} de {extractedResults.length} registros.
                      </p>
                    </div>
                    {csvHeaders.length > 0 && (
                      <Button onClick={downloadExtractedCSV} size="sm" className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Download className="size-4" />
                        Exportar CSV
                      </Button>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                          <th className="p-3">Texto / URL Original</th>
                          <th className="p-3">Latitud</th>
                          <th className="p-3">Longitud</th>
                          <th className="p-3">Resultado</th>
                          <th className="p-3 text-center">Enlaces</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedResults.slice(0, 50).map((res, idx) => (
                          <tr key={idx} className="border-b border-border/60 hover:bg-muted/10">
                            <td className="p-3 font-mono max-w-xs truncate" title={res.originalUrl}>
                              {res.originalUrl}
                            </td>
                            <td className="p-3 font-mono font-medium text-foreground">
                              {res.lat || <span className="text-muted-foreground/40">-</span>}
                            </td>
                            <td className="p-3 font-mono font-medium text-foreground">
                              {res.lng || <span className="text-muted-foreground/40">-</span>}
                            </td>
                            <td className="p-3">
                              {res.status === 'success' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-[10px] border border-emerald-500/20">
                                  ÉXITO
                                </span>
                              ) : res.status === 'empty' ? (
                                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold text-[10px]">
                                  VACÍO
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold text-[10px] border border-destructive/20">
                                  SIN COORDS
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {res.status === 'success' && (
                                <div className="flex justify-center gap-1.5">
                                  <a 
                                    href={getGoogleMapsSearch(res.lat, res.lng)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1 hover:bg-muted rounded text-primary"
                                    title="Ver en Google Maps"
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {extractedResults.length > 50 && (
                    <p className="text-[11px] text-muted-foreground text-center italic">
                      Se muestran las primeras 50 filas de {extractedResults.length}.
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Navigation Links Generator */}
        {activeTab === 'enlaces' && (
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Single generator */}
            <Card className="p-6 bg-card flex flex-col gap-5">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Generar Enlaces para una Coordenada
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ingresa latitud y longitud decimales para generar accesos directos rápidos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Latitud
                  </label>
                  <Input
                    placeholder="Ej: 24.008035"
                    value={singleLat}
                    onChange={(e) => setSingleLat(e.target.value)}
                    className="rounded-xl px-4 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Longitud
                  </label>
                  <Input
                    placeholder="Ej: -104.690138"
                    value={singleLng}
                    onChange={(e) => setSingleLng(e.target.value)}
                    className="rounded-xl px-4 py-2 text-xs"
                  />
                </div>
              </div>

              {singleLat && singleLng && !isNaN(parseFloat(singleLat)) && !isNaN(parseFloat(singleLng)) && (
                <div className="space-y-3.5 pt-2 animate-in fade-in duration-300">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Enlaces de Navegación:
                  </h4>
                  
                  {/* Google Maps Link Item */}
                  <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">G</div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Google Maps</p>
                        <p className="text-[10px] text-muted-foreground max-w-sm truncate font-mono">
                          {getGoogleMapsSearch(singleLat, singleLng)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={getGoogleMapsSearch(singleLat, singleLng)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-background border hover:bg-muted text-muted-foreground rounded-lg"
                        title="Abrir mapa"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard(getGoogleMapsSearch(singleLat, singleLng), 'google')} 
                        className="p-1.5 bg-background border hover:bg-muted text-muted-foreground rounded-lg"
                        title="Copiar enlace"
                      >
                        {copiedLinkType === 'google' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Waze Link Item */}
                  <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-sky-400/10 text-sky-500 flex items-center justify-center font-bold text-xs">W</div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Waze Navegación</p>
                        <p className="text-[10px] text-muted-foreground max-w-sm truncate font-mono">
                          {getWazeLink(singleLat, singleLng)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={getWazeLink(singleLat, singleLng)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-background border hover:bg-muted text-muted-foreground rounded-lg"
                        title="Abrir Waze"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard(getWazeLink(singleLat, singleLng), 'waze')} 
                        className="p-1.5 bg-background border hover:bg-muted text-muted-foreground rounded-lg"
                        title="Copiar enlace"
                      >
                        {copiedLinkType === 'waze' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Apple Maps Link Item */}
                  <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-gray-500/10 text-gray-500 flex items-center justify-center font-bold text-xs">A</div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Apple Maps</p>
                        <p className="text-[10px] text-muted-foreground max-w-sm truncate font-mono">
                          {getAppleMapsLink(singleLat, singleLng)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={getAppleMapsLink(singleLat, singleLng)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-background border hover:bg-muted text-muted-foreground rounded-lg"
                        title="Abrir Apple Maps"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard(getAppleMapsLink(singleLat, singleLng), 'apple')} 
                        className="p-1.5 bg-background border hover:bg-muted text-muted-foreground rounded-lg"
                        title="Copiar enlace"
                      >
                        {copiedLinkType === 'apple' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Bulk generator */}
            <Card className="p-6 bg-card flex flex-col gap-5">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <ArrowRightLeft className="size-4 text-primary" />
                  Generar Enlaces Masivos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ingresa coordenadas de formato `latitud longitud` (una por línea) para generar enlaces.
                </p>
              </div>

              <textarea
                value={bulkCoords}
                onChange={(e) => setBulkCoords(e.target.value)}
                placeholder="Ejemplo:&#10;24.008035, -104.690138&#10;24.015948, -104.704153"
                className="w-full min-h-36 bg-background border border-input rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
              
              <Button onClick={handleBulkGenerateLinks} className="rounded-xl">
                Generar Enlaces
              </Button>

              {extractedResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Resultados Masivos:
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-border rounded-xl text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                          <th className="p-2">Coordenadas</th>
                          <th className="p-2">Google Maps Search</th>
                          <th className="p-2">Waze Search</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedResults.map((res, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/10">
                            <td className="p-2 font-mono">{res.lat}, {res.lng}</td>
                            <td className="p-2 font-mono">
                              {res.status === 'success' ? (
                                <a href={getGoogleMapsSearch(res.lat, res.lng)} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                  Link <ExternalLink className="size-3" />
                                </a>
                              ) : <span className="text-destructive font-semibold text-[10px]">Error</span>}
                            </td>
                            <td className="p-2 font-mono">
                              {res.status === 'success' ? (
                                <a href={getWazeLink(res.lat, res.lng)} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                  Link <ExternalLink className="size-3" />
                                </a>
                              ) : <span className="text-destructive font-semibold text-[10px]">Error</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}



        {/* Tab 5: Levantamiento / Encuestas (Forms Builder) */}
        {activeTab === 'encuestas' && (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Form Builder / Data Settings Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* File Upload Zone */}
              {surveyRows.length === 0 ? (
                <Card className="p-6 border border-dashed border-border/80 hover:border-primary/50 transition-colors bg-card/50">
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleSurveyFileDrop}
                    className="flex flex-col items-center justify-center text-center p-4 cursor-pointer"
                    onClick={() => surveyFileInputRef.current?.click()}
                  >
                    <Upload className="size-10 text-muted-foreground mb-3 animate-bounce" />
                    <h3 className="font-semibold text-foreground text-sm mb-1">Cargar Archivo de Encuestas</h3>
                    <p className="text-xs text-muted-foreground max-w-56 mb-4">
                      Arrastra tu archivo CSV con columnas Dia, Ruta, Cliente aquí.
                    </p>
                    <input
                      type="file"
                      ref={surveyFileInputRef}
                      onChange={handleSurveyFileChange}
                      accept=".csv,.txt"
                      className="hidden"
                    />
                    <Button size="sm" variant="outline" className="rounded-xl">
                      Seleccionar Archivo
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 bg-card flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Estructura del Archivo</h3>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-40">{surveyFileName}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSurveyHeaders([]);
                        setSurveyRows([]);
                        setSurveyFileName('');
                        setSelDia('');
                        setSelRuta('');
                        setSelCliente('');
                        setInputComentario('');
                      }}
                      className="text-destructive hover:bg-destructive/10 rounded-xl size-8 p-0"
                      title="Eliminar Archivo"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {/* Manual Mappings if auto-mapping wasn't perfect */}
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Columna Día</label>
                      <select
                        value={colDiaIdx}
                        onChange={(e) => {
                          setColDiaIdx(parseInt(e.target.value));
                          setSelDia('');
                          setSelRuta('');
                          setSelCliente('');
                        }}
                        className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer"
                      >
                        {surveyHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header || `Columna ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Columna Ruta</label>
                      <select
                        value={colRutaIdx}
                        onChange={(e) => {
                          setColRutaIdx(parseInt(e.target.value));
                          setSelDia('');
                          setSelRuta('');
                          setSelCliente('');
                        }}
                        className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer"
                      >
                        {surveyHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header || `Columna ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Columna Cliente</label>
                      <select
                        value={colClienteIdx}
                        onChange={(e) => {
                          setColClienteIdx(parseInt(e.target.value));
                          setSelDia('');
                          setSelRuta('');
                          setSelCliente('');
                        }}
                        className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer"
                      >
                        {surveyHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header || `Columna ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>
              )}

              {/* Note on how this works */}
              <Card className="p-4 bg-muted/40 border border-border rounded-xl flex gap-3 text-xs text-muted-foreground leading-relaxed">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">¿Cómo levantar comentarios?</p>
                  Sube un archivo con los clientes. Selecciona el Día y Ruta para cargar la lista de clientes correspondientes. Ingresa el comentario y presiona &quot;Guardar&quot;. Los comentarios se guardarán en caliente sobre el archivo para que los puedas exportar cuando gustes.
                </div>
              </Card>
            </div>

            {/* Dynamic Survey Form Panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {surveyRows.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Dynamic Form */}
                  <Card className="p-6 bg-card flex flex-col gap-4">
                    <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Formulario de Registro</h3>
                    
                    <form onSubmit={handleSurveySubmit} className="space-y-4">
                      
                      {/* Step 1: Select Día */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          1. Seleccionar Día
                        </label>
                        <select
                          value={selDia}
                          onChange={(e) => {
                            setSelDia(e.target.value);
                            setSelRuta('');
                            setSelCliente('');
                            setInputComentario('');
                          }}
                          className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer h-10"
                        >
                          <option value="">-- Seleccionar Día --</option>
                          {getUniqueDias().map((dia) => (
                            <option key={dia} value={dia}>{dia}</option>
                          ))}
                        </select>
                      </div>

                      {/* Step 2: Select Ruta */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          2. Seleccionar Ruta
                        </label>
                        <select
                          value={selRuta}
                          disabled={!selDia}
                          onChange={(e) => {
                            setSelRuta(e.target.value);
                            setSelCliente('');
                            setInputComentario('');
                          }}
                          className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer h-10 disabled:opacity-50"
                        >
                          <option value="">-- Seleccionar Ruta --</option>
                          {getUniqueRutas().map((ruta) => (
                            <option key={ruta} value={ruta}>{ruta}</option>
                          ))}
                        </select>
                      </div>

                      {/* Step 3: Select Cliente */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          3. Seleccionar Cliente
                        </label>
                        <select
                          value={selCliente}
                          disabled={!selRuta}
                          onChange={(e) => handleClienteSelectChange(e.target.value)}
                          className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus-visible:outline-none cursor-pointer h-10 disabled:opacity-50"
                        >
                          <option value="">-- Seleccionar Cliente --</option>
                          {getUniqueClientes().map((cli) => (
                            <option key={cli} value={cli}>{cli}</option>
                          ))}
                        </select>
                      </div>

                      {/* Step 4: Comment Area */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          4. Comentarios / Levantamiento
                        </label>
                        <textarea
                          disabled={!selCliente}
                          value={inputComentario}
                          onChange={(e) => setInputComentario(e.target.value)}
                          placeholder="Ingresa los comentarios, observaciones o notas respecto al cliente..."
                          className="w-full min-h-24 bg-background border border-input rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={!selCliente}
                        className="w-full rounded-xl"
                      >
                        Guardar Comentario
                      </Button>
                    </form>
                  </Card>

                  {/* Summary / Download Card */}
                  <Card className="p-6 bg-card flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground text-sm border-b border-border pb-2">Estado del Levantamiento</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/40 rounded-xl text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clientes Totales</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{surveyRows.length}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                          <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Con Comentarios</p>
                          <p className="text-2xl font-bold text-emerald-500 mt-1">{getRowsWithComments().length}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                          <span>Progreso de llenado</span>
                          <span>{surveyRows.length > 0 ? Math.round((getRowsWithComments().length / surveyRows.length) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${surveyRows.length > 0 ? (getRowsWithComments().length / surveyRows.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={downloadSurveyCSV} 
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 mt-4"
                    >
                      <Download className="size-4" />
                      Descargar CSV Actualizado
                    </Button>
                  </Card>

                  {/* Table of Comments Already Filled */}
                  {getRowsWithComments().length > 0 && (
                    <Card className="p-6 bg-card md:col-span-2 flex flex-col gap-4">
                      <h3 className="font-semibold text-foreground text-sm">Comentarios Registrados</h3>
                      <div className="overflow-x-auto border border-border rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                              <th className="p-3">Cliente</th>
                              <th className="p-3">Día</th>
                              <th className="p-3">Ruta</th>
                              <th className="p-3">Comentario</th>
                              <th className="p-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getRowsWithComments().map((row, idx) => (
                              <tr key={idx} className="border-b border-border/60 hover:bg-muted/10">
                                <td className="p-3 font-semibold text-foreground">{row[colClienteIdx]}</td>
                                <td className="p-3 font-mono">{row[colDiaIdx]}</td>
                                <td className="p-3 font-mono">{row[colRutaIdx]}</td>
                                <td className="p-3 text-muted-foreground max-w-xs truncate" title={row[colComentarioIdx]}>
                                  {row[colComentarioIdx]}
                                </td>
                                <td className="p-3">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-lg text-[10px] px-2.5 h-7"
                                      onClick={() => {
                                        setSelDia(row[colDiaIdx]);
                                        setSelRuta(row[colRutaIdx]);
                                        setSelCliente(row[colClienteIdx]);
                                        setInputComentario(row[colComentarioIdx]);
                                      }}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="rounded-lg text-destructive hover:bg-destructive/10 text-[10px] px-2.5 h-7"
                                      onClick={() => {
                                        const updatedRows = [...surveyRows];
                                        const rIdx = updatedRows.indexOf(row);
                                        if (rIdx !== -1) {
                                          updatedRows[rIdx][colComentarioIdx] = '';
                                          setSurveyRows(updatedRows);
                                          toast.success('Comentario eliminado.');
                                        }
                                      }}
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                </div>
              ) : (
                <Card className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card/10">
                  <ClipboardList className="size-12 mx-auto mb-4 text-muted-foreground/40 animate-pulse" />
                  <p className="font-semibold text-sm text-foreground">Esperando Carga de Archivo</p>
                  <p className="text-xs max-w-sm mx-auto mt-1">
                    Carga un archivo de encuestas en el panel izquierdo para iniciar el levantamiento de comentarios.
                  </p>
                </Card>
              )}

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
