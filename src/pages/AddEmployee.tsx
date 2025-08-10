import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/api/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Use FormCard wrapper for consistent form layout
import FormCard from "@/components/FormCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LucideArrowLeft,
  LucideUserPlus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import FormActions from "@/components/FormActions";

const AddEmployee = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // use the toast function from sonner

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(
        t("employees.confirmPassword") + " " + t("common.error").toLowerCase()
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(t("employees.passwordMinLength"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authAPI.registerEmployee(formData.name, formData.password);

      // Show success notification
      toast(t("common.success"), {
        icon: <CheckCircle color="green" />, 
        description:
          t("employees.add") + " " + t("common.success").toLowerCase(),
      });

      navigate("/employees");
    } catch (err: any) {
      console.error("Error registering employee:", err);
      setError(err.message || t("common.error"));

      toast(t("common.error"), {
        icon: <AlertTriangle color="red" />,
        description: err.message || t("common.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() => navigate("/employees")}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      {/* Wrap the form around the FormCard so submit works */}
      <form onSubmit={handleSubmit}>
        <FormCard
          title={t("employees.add")}
          description={t("employees.create")}
          footer={
            <FormActions
              loading={loading}
              cancelLabel={t("common.cancel")}
              submitLabel={t("employees.create")}
              loadingLabel={t("common.loading")}
              onCancel={() => navigate("/employees")}
              submitIcon={<LucideUserPlus className="h-4 w-4" />}
            />
          }
        >
          {error && (
            <Alert variant="destructive" className="glass-card">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="glassy-text">
              {t("employees.name")}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t("employees.name")}
              required
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="glassy-text">
              {t("employees.password")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="glassy-text">
              {t("employees.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              className="glass-input"
            />
          </div>
        </FormCard>
      </form>
    </div>
  );
};

export default AddEmployee;
