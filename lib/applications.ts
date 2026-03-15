import { ApplicationBoardColumn, ApplicationCard, ApplicationStatus } from '@/types/domain';

export const applicationStatuses: ApplicationStatus[] = [
  'SAVED',
  'READY',
  'APPLIED',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN'
];

export function groupApplicationsForBoard(applications: ApplicationCard[]): ApplicationBoardColumn[] {
  return applicationStatuses.map((status) => ({
    status,
    items: applications.filter((item) => item.status === status)
  }));
}
