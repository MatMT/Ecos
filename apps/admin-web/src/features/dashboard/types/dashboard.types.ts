export interface DashboardStudentSummary {
  id: number;
  studentCode: string | null;
}

export interface AdministratorDashboard {
  studentCount: number;
  psychologistCount: number;
  administratorCount: number;
  activeAssignmentCount: number;
  todayAppointmentCount: number;
  boundBandDeviceCount: number;
}

export interface PsychologistDashboard {
  assignedPatients: DashboardStudentSummary[];
  todayAppointments: any[];
  upcomingAppointments: any[];
  pendingAlerts: any[];
  priorityAlerts: any[];
  pendingActivities: any[];
  recentFollowUp: any[];
}
