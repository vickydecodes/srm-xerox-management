import {
  Create, Delete, Erase, Retrieve, ActiveStatus, View, ManageCredit, ClearCreditByBill
} from "./department.modal.components";
import { DepartmentReportModal } from "./department-report.modal";

export const modals = {
  create: Create,
  delete: Delete,
  erase: Erase,
  retrieve: Retrieve,
  activeStatus: ActiveStatus,
  view: View,
  manageCredit: ManageCredit,
  clearCreditByBill: ClearCreditByBill,
  report: DepartmentReportModal,
}