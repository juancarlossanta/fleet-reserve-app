import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { KeyRound, ArrowLeft, Mail, Shield } from "lucide-react";

type ResetStep = "email" | "code" | "newPassword";

const ResetPassword = () => {
  const [step, setStep] = useState<ResetStep>("email");
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (step === "email") {
      if (!formData.email.trim()) {
        newErrors.email = "Ingresar Correo Electrónico";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Formato de correo electrónico inválido";
      }
    } else if (step === "code") {
      if (!formData.code.trim()) {
        newErrors.code = "Ingresar Código";
      }
    } else if (step === "newPassword") {
      if (!formData.newPassword) {
        newErrors.newPassword = "Ingresar Nueva Contraseña";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (step === "email") {
        // Simulate sending recovery code
        toast({
          title: "Código enviado",
          description: `Se ha enviado un código de recuperación a ${formData.email}`,
        });
        setStep("code");
      } else if (step === "code") {
        // Simulate code verification
        if (formData.code !== "123456") {
          toast({
            title: "Código incorrecto",
            description: "El código ingresado no es válido. Verifica e intenta nuevamente.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Código verificado",
          description: "Ahora puedes establecer tu nueva contraseña",
        });
        setStep("newPassword");
      } else if (step === "newPassword") {
        // Simulate password reset
        toast({
          title: "¡Contraseña restablecida!",
          description: "Tu contraseña ha sido actualizada exitosamente",
        });
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case "email":
        return <Mail className="h-8 w-8 text-bus-primary" />;
      case "code":
        return <Shield className="h-8 w-8 text-bus-warning" />;
      case "newPassword":
        return <KeyRound className="h-8 w-8 text-bus-success" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Restablecer Contraseña";
      case "code":
        return "Verificar Código";
      case "newPassword":
        return "Nueva Contraseña";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Ingresa tu correo electrónico para recibir un código de recuperación";
      case "code":
        return "Ingresa el código de 6 dígitos enviado a tu correo electrónico";
      case "newPassword":
        return "Establece tu nueva contraseña para completar el proceso";
    }
  };

  return (
    <Layout title="FleetGuard360" subtitle="Restablecer Contraseña">
      <div className="max-w-md mx-auto">
        <Card className="shadow-elegant bg-gradient-card border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              {getStepIcon()}
            </div>
            <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
            <CardDescription>
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {step === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-bus-danger focus:ring-bus-danger" : ""}
                    placeholder="usuario@dominio.com"
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-invalid={!!errors.email}
                  />
                  <div className="h-5">
                    {errors.email && (
                      <p id="email-error" className="text-sm text-bus-danger" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === "code" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email-display">Correo Electrónico</Label>
                    <Input
                      id="email-display"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código de Verificación</Label>
                    <Input
                      id="code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      className={errors.code ? "border-bus-danger focus:ring-bus-danger" : ""}
                      placeholder="Ingresa el código de 6 dígitos"
                      maxLength={6}
                      aria-describedby={errors.code ? "code-error" : undefined}
                      aria-invalid={!!errors.code}
                    />
                    <div className="h-5">
                      {errors.code && (
                        <p id="code-error" className="text-sm text-bus-danger" role="alert">
                          {errors.code}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Código de prueba: 123456
                    </p>
                  </div>
                </>
              )}

              {step === "newPassword" && (
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    className={errors.newPassword ? "border-bus-danger focus:ring-bus-danger" : ""}
                    placeholder="Ingresa tu nueva contraseña"
                    aria-describedby={errors.newPassword ? "new-password-error" : undefined}
                    aria-invalid={!!errors.newPassword}
                  />
                  <div className="h-5">
                    {errors.newPassword && (
                      <p id="new-password-error" className="text-sm text-bus-danger" role="alert">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent-hover text-accent-foreground shadow-button transition-smooth"
                disabled={isLoading}
              >
                {isLoading 
                  ? "Procesando..." 
                  : step === "email" 
                    ? "Enviar Código" 
                    : step === "code" 
                      ? "Verificar Código" 
                      : "Restablecer Contraseña"
                }
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-smooth">
                  Iniciar Sesión
                </Link>
              </p>
              
              <Button variant="ghost" asChild className="text-muted-foreground">
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Inicio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;