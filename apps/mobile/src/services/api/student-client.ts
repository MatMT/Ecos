import { authClient } from './auth-client';

export interface InstitutionSummary {
  id: number;
  name: string | null;
}

export interface AssignedTherapist {
  id: string; // UUID
  fullName: string | null;
  email: string | null;
  specialty: string | null;
  phone: string | null;
  professionalLicense: string | null;
}

export interface NextAppointment {
  id: number;
  appointmentDate: string | null;
  status: string | null;
  reason: string | null;
}

export interface StudentProfileData {
  id: number; // studentProfileId
  userId: string;
  studentCode: string | null;
  primaryDiagnosis: string | null;
  fullName: string | null;
  email: string | null;
  institution: InstitutionSummary | null;
  assignedTherapist: AssignedTherapist | null;
  nextAppointment: NextAppointment | null;
  activeGoalsCount: number;
}

export interface BiometricTrendPoint {
  date: string;
  avgHeartRate: number | null;
  avgStressLevel: number | null;
  avgSleepQualityHours: number | null;
  avgBloodOxygen: number | null;
  minHeartRate: number | null;
  maxHeartRate: number | null;
}

export interface AppointmentItem {
  id: number;
  appointmentDate: string;
  status: string;
  reason: string | null;
  doctor?: {
    id: string;
    fullName: string | null;
    email: string | null;
  };
}

export const studentClient = {
  async getMe(): Promise<StudentProfileData> {
    const res = await authClient.apiFetch('/api/v1/students/me');
    if (!res.ok) {
      throw new Error(`Failed to fetch student profile: ${res.status}`);
    }
    return res.json() as Promise<StudentProfileData>;
  },

  async getBiometricTrends(
    studentId: number,
    from?: string,
    to?: string,
  ): Promise<BiometricTrendPoint[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await authClient.apiFetch(
      `/api/v1/students/${studentId}/biometrics/trends${query}`,
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch biometric trends: ${res.status}`);
    }
    return res.json() as Promise<BiometricTrendPoint[]>;
  },

  async getAppointments(studentId: number): Promise<AppointmentItem[]> {
    const res = await authClient.apiFetch(`/api/v1/appointments?studentId=${studentId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch appointments: ${res.status}`);
    }
    return res.json() as Promise<AppointmentItem[]>;
  },
};
