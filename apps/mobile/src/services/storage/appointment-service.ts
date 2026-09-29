import {
  saveLocalAppointments,
  getLocalAppointments,
  saveSingleLocalAppointment,
  enqueueSync,
  type LocalAppointmentRecord,
} from './local-db';
import {
  studentClient,
  type AppointmentItem,
  type RequestAppointmentInput,
} from '@/services/api/student-client';

export async function fetchAndCacheAppointments(
  studentId: number
): Promise<AppointmentItem[]> {
  try {
    const remoteAppointments = await studentClient.getAppointments(studentId);

    // Map to SQLite local format
    const localRecords: LocalAppointmentRecord[] = remoteAppointments.map((item) => ({
      id: item.id,
      appointment_date: item.appointmentDate,
      status: item.status,
      reason: item.reason,
      doctor_name: item.doctor?.fullName,
      doctor_id: item.doctor?.id,
      modality: null,
      synced: 1,
    }));

    await saveLocalAppointments(localRecords);
    return remoteAppointments;
  } catch (error) {
    // If offline or network error, fallback to local SQLite cache
    const cached = await getLocalAppointments();
    if (cached.length > 0) {
      return cached.map((c) => ({
        id: c.id,
        appointmentDate: c.appointment_date,
        status: c.status,
        reason: c.reason ?? null,
        doctor: c.doctor_id
          ? {
              id: c.doctor_id,
              fullName: c.doctor_name ?? null,
              email: null,
            }
          : undefined,
      }));
    }
    throw error;
  }
}

export async function submitAppointmentRequest(
  input: RequestAppointmentInput,
  therapistName?: string | null
): Promise<AppointmentItem> {
  try {
    const created = await studentClient.requestAppointment(input);
    await saveSingleLocalAppointment({
      id: created.id,
      appointment_date: created.appointmentDate,
      status: created.status,
      reason: created.reason,
      doctor_name: created.doctor?.fullName ?? therapistName,
      doctor_id: created.doctor?.id ?? input.doctorId,
      modality: input.modality,
      synced: 1,
    });
    return created;
  } catch {
    // If offline, generate temporary client ID and enqueue for background sync
    const tempId = -Math.floor(Date.now() / 1000);
    const localRecord: LocalAppointmentRecord = {
      id: tempId,
      appointment_date: input.appointmentDate,
      status: 'pending',
      reason: input.reason ?? null,
      doctor_name: therapistName ?? null,
      doctor_id: input.doctorId ?? null,
      modality: input.modality,
      synced: 0,
    };

    await saveSingleLocalAppointment(localRecord);
    await enqueueSync('/api/v1/appointments/request', input);

    return {
      id: tempId,
      appointmentDate: input.appointmentDate,
      status: 'pending',
      reason: input.reason ?? null,
      doctor: input.doctorId
        ? {
            id: input.doctorId,
            fullName: therapistName ?? null,
            email: null,
          }
        : undefined,
    };
  }
}
