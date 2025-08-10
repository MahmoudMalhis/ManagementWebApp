import React from "react";
import { Button } from "@/components/ui/button";
import { LucideLoader } from "lucide-react";

/**
 * FormActions renders a pair of cancel and submit buttons commonly used
 * at the bottom of forms. It centralizes the loading and icon logic
 * so pages don't have to repeat the same markup. You can customise the
 * labels and icon shown on the submit button via props.
 */
interface FormActionsProps {
  /** Whether a submission is in progress. Disables the submit button and shows a loader. */
  loading?: boolean;
  /** Label shown on the cancel button. */
  cancelLabel: string;
  /** Label shown on the submit button when not loading. */
  submitLabel: string;
  /** Label shown on the submit button when loading. */
  loadingLabel: string;
  /** Handler invoked when the cancel button is clicked. */
  onCancel: () => void;
  /** Icon displayed to the left of the submit label. */
  submitIcon: React.ReactNode;
}

const FormActions: React.FC<FormActionsProps> = ({
  loading = false,
  cancelLabel,
  submitLabel,
  loadingLabel,
  onCancel,
  submitIcon,
}) => {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="glass-btn"
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 glass-btn"
      >
        {loading ? (
          <>
            <LucideLoader className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            {submitIcon}
            {submitLabel}
          </>
        )}
      </Button>
    </>
  );
};

export default FormActions;