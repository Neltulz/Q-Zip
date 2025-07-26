/**
 * @preserve
 * Description:
 * This file defines the shared TypeScript types and interfaces used throughout
 * the modal system, ensuring type safety for modal options, buttons, and the
 * structure of active modals in the store.
 */

export type BtnTheme =
  | "primary"
  | "danger"
  | "warning"
  | "info"
  | "lite"
  | "liter"
  | "dark"
  | "darkr"
  | "default";

export type JustifyContent = "auto" | "start" | "center" | "end" | "stretch";

export interface ModalButton {
  readonly text: string;
  readonly action: string;
  readonly theme?: BtnTheme;
  readonly styleClass?: string;
  readonly icon?: string;
  readonly isDefault?: boolean;
  readonly justify?: JustifyContent;
}

export interface ModalOptions {
  readonly icon?: string;
  readonly title: string;
  // FIX: Allow readonly arrays to be passed from the store.
  readonly description?: string | readonly string[];
  readonly buttons?: readonly ModalButton[];
  readonly footerJustifyContent?: string;
}

export interface ActiveModal {
  readonly id: string;
  readonly component: string;
  readonly props?: Record<string, unknown>;
  readonly options: ModalOptions;
  readonly onClose?: (action: string) => void; // Callback for when the modal closes
}
