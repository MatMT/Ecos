import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { therapistsApi } from '../api/therapists.api';
import { CreateTherapistDto, UpdateTherapistDto } from '../dto/therapists.dto';

export const therapistsKeys = {
  all: ['therapists'] as const,
  lists: () => [...therapistsKeys.all, 'list'] as const,
  list: (skip: number, take: number) => [...therapistsKeys.lists(), { skip, take }] as const,
  details: () => [...therapistsKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...therapistsKeys.details(), id] as const,
  patients: (id: number | string) => [...therapistsKeys.detail(id), 'patients'] as const,
};

export function useTherapists(skip: number = 0, take: number = 20) {
  return useQuery({
    queryKey: therapistsKeys.list(skip, take),
    queryFn: ({ signal }) => therapistsApi.getAll(skip, take, signal),
  });
}

export function useTherapist(id: number | string) {
  return useQuery({
    queryKey: therapistsKeys.detail(id),
    queryFn: ({ signal }) => therapistsApi.getById(id, signal),
    enabled: !!id,
  });
}

export function useTherapistPatients(id: number | string) {
  return useQuery({
    queryKey: therapistsKeys.patients(id),
    queryFn: ({ signal }) => therapistsApi.getPatients(id, signal),
    enabled: !!id,
  });
}

export function useCreateTherapist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTherapistDto) => therapistsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: therapistsKeys.lists() });
    },
  });
}

export function useUpdateTherapist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateTherapistDto }) => 
      therapistsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: therapistsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: therapistsKeys.detail(variables.id) });
    },
  });
}
