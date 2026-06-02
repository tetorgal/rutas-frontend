import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/api";

export interface Ruta {
  id: string;
  nombre: string;
  colorHex: string;
}

export interface Vendedor {
  lid: string;
  nombreReal: string;
  telefono?: string | null;
  activo: boolean;
  rutaActualId?: string | null;
  rutaActual?: Ruta | null;
  creadoEn: string;
}

export interface Ubicacion {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  SAP: string;
  urlOriginal: string;
  vendedorLid?: string | null;
  vendedor?: Vendedor;
  rutaId?: string | null;
  ruta?: Ruta | null;
  diasVisita?: (
    | "LUNES"
    | "MARTES"
    | "MIERCOLES"
    | "JUEVES"
    | "VIERNES"
    | "SABADO"
  )[];
  creadoEn: string;
}

export interface Solicitud {
  lid: string;
  nombreWa?: string;
  fecha: string;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
}

export function createGenericApiHooks<T>(
  endpoint: string,
  queryKey: string,
  keyField: keyof T = "id" as keyof T,
) {
  return {
    useGetAll: (params?: Record<string, string>) => {
      return useQuery<T[]>({
        queryKey: params ? [queryKey, params] : [queryKey],
        queryFn: async () => {
          const { data } = await axiosInstance.get<T[]>(endpoint, { params });
          return data;
        },
      });
    },
    useCreate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (newItem: Partial<T>) => {
          const { data } = await axiosInstance.post<T>(endpoint, newItem);
          return data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },
    useUpdate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (updatedItem: Partial<T>) => {
          const key = (updatedItem as Record<string, unknown>)[
            keyField as string
          ];
          const { data } = await axiosInstance.put<T>(
            `${endpoint}/${key}`,
            updatedItem,
          );
          return data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },
    useDelete: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (key: string) => {
          await axiosInstance.delete(`${endpoint}/${key}`);
          return key;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },
  };
}

// Hook to fetch all locations (remains fully backward compatible)
export function useUbicaciones() {
  return useQuery<Ubicacion[]>({
    queryKey: ["ubicaciones"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Ubicacion[]>("/ubicaciones");
      return data;
    },
  });
}

// Hook to fetch all routes (remains fully backward compatible)
export function useRutas() {
  return useQuery<Ruta[]>({
    queryKey: ["rutas"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Ruta[]>("/rutas");
      return data;
    },
  });
}

// Specific CRUD API hook instances with custom keys
export const vendedorApi = createGenericApiHooks<Vendedor>(
  "/vendedores",
  "vendedores",
  "lid",
);
export const rutaApi = createGenericApiHooks<Ruta>("/rutas", "rutas");
export const ubicacionApi = createGenericApiHooks<Ubicacion>(
  "/ubicaciones",
  "ubicaciones",
);

const baseSolicitudApi = createGenericApiHooks<Solicitud>(
  "/solicitudes",
  "solicitudes",
  "lid",
);

export const solicitudApi = {
  ...baseSolicitudApi,
  useAprobar: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({
        lid,
        nombreReal,
        telefono,
        rutaActualId,
      }: {
        lid: string;
        nombreReal?: string;
        telefono?: string;
        rutaActualId?: string;
      }) => {
        const { data } = await axiosInstance.post(
          `/solicitudes/${lid}/aprobar`,
          {
            nombreReal,
            telefono,
            rutaActualId,
          },
        );
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
        queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      },
    });
  },
  useRechazar: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (lid: string) => {
        const { data } = await axiosInstance.post(
          `/solicitudes/${lid}/rechazar`,
        );
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
        queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      },
    });
  },
};
