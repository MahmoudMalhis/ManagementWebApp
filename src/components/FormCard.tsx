import { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface FormCardProps {
  /**
   * Title to display in the card header.
   */
  title: ReactNode;
  /**
   * Optional description text for the card header.
   */
  description?: ReactNode;
  /**
   * Content of the card. Typically form fields.
   */
  children: ReactNode;
  /**
   * Optional footer content, such as buttons.
   */
  footer?: ReactNode;
}

/**
 * FormCard is a reusable wrapper around the shadcn Card component that
 * provides a common structure for forms: a header with a title and
 * optional description, a content area for fields, and an optional
 * footer. Using this component helps reduce repeated markup across
 * different pages when building similar forms.
 */
const FormCard = ({ title, description, children, footer }: FormCardProps) => (
  <Card className="glass-card border-none">
    <CardHeader>
      <CardTitle className="glassy-text">{title}</CardTitle>
      {description && (
        <CardDescription className="glassy-text">
          {description}
        </CardDescription>
      )}
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
    {footer && (
      <CardFooter className="flex justify-end space-x-2 gap-3">
        {footer}
      </CardFooter>
    )}
  </Card>
);

export default FormCard;