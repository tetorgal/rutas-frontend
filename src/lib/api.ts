import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5200',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error handling and toast notifications
axiosInstance.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE'].includes(method)) {
      let action = 'procesada';
      if (method === 'POST') action = 'creada / registrada';
      if (method === 'PUT') action = 'actualizada';
      if (method === 'DELETE') action = 'eliminada';
      
      toast.success(`Información ${action} correctamente.`);
    }
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const status = error.response.status;
      const data = error.response.data as { message?: string } | undefined;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || 'Solicitud incorrecta (400)';
          break;
        case 401:
          errorMessage = 'Sesión no autorizada. Por favor, inicia sesión de nuevo (401)';
          break;
        case 403:
          errorMessage = 'No tienes permiso para acceder a este recurso (403)';
          break;
        case 404:
          errorMessage = data?.message || 'Recurso no encontrado (404)';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo de nuevo más tarde (500)';
          break;
        default:
          errorMessage = data?.message || `Error del servidor (${status})`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión de red';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message;
    }

    console.error('API Error:', {
      message: errorMessage,
      originalError: error,
    });

    toast.error(errorMessage);

    return Promise.reject(new Error(errorMessage));
  }
);
