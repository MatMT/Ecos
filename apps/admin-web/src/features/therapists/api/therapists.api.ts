import { api } from '@/lib/api/client';
import { 
  TherapistResponse, 
  CreateTherapistDto, 
  UpdateTherapistDto 
} from '../dto/therapists.dto';

export const therapistsApi = {
  getAll: async (skip: number = 0, take: number = 20, signal?: AbortSignal): Promise<TherapistResponse[]> => {
    // The backend uses ?skip=x&take=y for pagination without wrapping in an envelope
    return api.get('/psychologists', { 
      signal,
      params: {
        skip: skip.toString(),
        take: take.toString(),
      }
    });
  },

  getById: async (id: number | string, signal?: AbortSignal): Promise<TherapistResponse> => {
    // Note: The backend uses userId (UUID) as the id parameter
    return api.get(`/psychologists/${id}`, { signal });
  },

  getPatients: async (id: number | string, signal?: AbortSignal): Promise<any[]> => {
    // We import PatientListItem type in the component/hook layer or define it locally,
    // For the API client return type, we can return any[] and type it properly in the hook
    // to avoid coupling or circular dependencies if not strictly needed.
    return api.get(`/psychologists/${id}/students`, { signal });
  },

  create: async (data: CreateTherapistDto): Promise<TherapistResponse> => {
    return api.post('/psychologists', data);
  },

  update: async (id: number | string, data: UpdateTherapistDto): Promise<TherapistResponse> => {
    return api.patch(`/psychologists/${id}`, data);
  },
};
