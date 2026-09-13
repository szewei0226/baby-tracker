import type {
  MedicationAdministration,
  MedicationAdministrationInput,
  MedicationPlan,
  MedicationPlanInput,
} from "../../types";

export interface MedicationRepository {
  createPlan(input: MedicationPlanInput): Promise<MedicationPlan>;
  getPlan(id: number): Promise<MedicationPlan | null>;
  listPlans(status?: MedicationPlan["status"]): Promise<MedicationPlan[]>;
  updatePlan(id: number, updates: Partial<MedicationPlanInput>): Promise<void>;
  createAdministration(
    medicationId: number,
    input: MedicationAdministrationInput,
  ): Promise<MedicationAdministration>;
  getAdministration(id: number): Promise<MedicationAdministration | null>;
  listAdministrations(
    medicationId: number,
  ): Promise<MedicationAdministration[]>;
  updateAdministration(
    id: number,
    updates: Partial<MedicationAdministrationInput>,
  ): Promise<void>;
  deleteAdministration(id: number): Promise<void>;
}
