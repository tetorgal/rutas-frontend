import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/api';

export interface Ubicacion {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  nombreVendedor: string;
  urlOriginal: string;
}

// Hook to fetch all locations
export function useUbicaciones() {
  return useQuery<Ubicacion[]>({
    queryKey: ['ubicaciones'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Ubicacion[]>('/ubicaciones');
      return data;
    },
  });
}

// Hook to create a location
export function useCreateUbicacion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nuevaUbi: Omit<Ubicacion, 'id'>) => {
      const { data } = await axiosInstance.post<Ubicacion>('/ubicaciones', nuevaUbi);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
    },
  });
}

// Hook to delete a location
export function useDeleteUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/ubicaciones/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
    },
  });
}
