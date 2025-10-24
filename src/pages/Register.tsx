import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { UserPlus, ArrowLeft } from "lucide-react";

// URL de tu endpoint GraphQL de Spring Boot
const GRAPHQL_ENDPOINT = "http://localhost:8080/graphql";
// Constante para el tamaño mínimo de la contraseña
const MIN_PASSWORD_LENGTH = 8;

// Definición de tipos para los datos del formulario
interface FormData {
  nombre: string;
  apellido: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellido: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Lógica de Validación ---
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Función de validación de longitud de contraseña
    const validatePasswordLength = (val: string) => 
      val.length < MIN_PASSWORD_LENGTH 
        ? `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` 
        : null;

    const fields: Array<{ name: keyof FormData, label: string, extraValidation?: (value: string) => string | null }> = [
        { name: 'nombre', label: 'Nombre' },
        { name: 'apellido', label: 'Apellido' },
        { name: 'username', label: 'Nombre de Usuario' },
        { name: 'phone', label: 'Teléfono' }, 
        { name: 'email', label: 'Correo Electrónico', extraValidation: (val) => !validateEmail(val) ? 'Formato de correo electrónico inválido' : null },
        // **[CAMBIO]** Aplicar validación de longitud a la contraseña
        { name: 'password', label: 'Contraseña', extraValidation: validatePasswordLength }, 
        { name: 'confirmPassword', label: 'Confirmación de Contraseña' }
    ];

    fields.forEach(({ name, label, extraValidation }) => {
        const value = formData[name].trim();
        if (!value) {
            newErrors[name] = `Ingresar ${label}`;
        } else if (extraValidation) {
            const extraError = extraValidation(value);
            if (extraError) {
                newErrors[name] = extraError;
            }
        }
    });

    // Validación de coincidencia de contraseñas
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Asegurar que si la password no cumple la longitud, el error se propague a confirmPassword si no tiene otro error
    if (newErrors.password && !newErrors.confirmPassword) {
      // Si el error de password es por longitud y confirmPassword está vacío, se marca
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = `Ingresar Confirmación de Contraseña`;
      }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // --- Lógica de la API (GraphQL) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor revisa y completa todos los campos marcados en rojo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { nombre, apellido, phone, username, email, password, confirmPassword } = formData;
    
    const registerMutation = `
      mutation RegisterPasajero {
        registerPasajero(
          input: {
            nombre: "${nombre}", 
            apellido: "${apellido}", 
            telefono: "${phone}", 
            username: "${username}", 
            email: "${email}", 
            password: "${password}", 
            passwordConfirm: "${confirmPassword}"
          }
        ) {
          success
          message  
          pasajero {
            id
            username
            email
          }
        }
      }
    `;

    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: registerMutation }),
      });
      
      const result = await response.json();
      
      if (!response.ok || result.errors) {
        const errorMessage = result.errors 
            ? result.errors[0].message 
            : "Error de red o servidor al procesar la solicitud.";
        
        toast({
          title: "Error en la conexión o GraphQL",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      const registrationData = result.data.registerPasajero;
      
      if (registrationData.success) {
        toast({
          title: "¡Registro exitoso! 🚀",
          description: registrationData.message,
        });
        
        navigate("/login");
      } else {
        toast({
          title: "Error de Validación",
          description: registrationData.message,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error al conectar con la API:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor. Verifica que el backend esté activo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error al empezar a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    
    // Validación de formato de email en tiempo real
    if (field === "email" && value.trim()) {
      if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: "Formato de correo electrónico inválido" }));
      }
    }
    
    // **[CAMBIO]** Validación de longitud de contraseña en tiempo real
    if (field === "password" && value.length > 0) {
        if (value.length < MIN_PASSWORD_LENGTH) {
            setErrors(prev => ({ ...prev, password: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` }));
        } else if (errors.password) {
            // Limpiar si ya cumple y había error previo
            setErrors(prev => ({ ...prev, password: "" }));
        }
    }
    
    // Validación de confirmación de contraseña en tiempo real
    if (field === "confirmPassword" || field === "password") {
        const passwordValue = field === "password" ? value : formData.password;
        const confirmValue = field === "confirmPassword" ? value : formData.confirmPassword;
        
        const isPasswordLongEnough = passwordValue.length >= MIN_PASSWORD_LENGTH;
        
        // Comprobación de coincidencia (solo si ambas están escritas y la principal es válida)
        if (passwordValue.length > 0 && confirmValue.length > 0 && passwordValue !== confirmValue && isPasswordLongEnough) {
            setErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }));
        } else if (passwordValue === confirmValue && errors.confirmPassword === "Las contraseñas no coinciden") {
            // Limpiar error de coincidencia
            setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
        
        // Si la contraseña es muy corta, se elimina el error de confirmación para evitar mensajes dobles,
        // ya que el error de 'password' es más relevante.
        if (!isPasswordLongEnough && errors.confirmPassword === "Las contraseñas no coinciden") {
            setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
    }
  };
  
  // Componente de Error Reutilizable (Mantiene la altura fija)
  const ErrorMessage = ({ field }: { field: keyof FormData }) => (
      <div className="h-5"> 
          {errors[field] && (
              <p id={`${field}-error`} className="text-sm text-bus-danger" role="alert">
                  {errors[field]}
              </p>
          )}
      </div>
  );

  // --- Renderizado (Se mantiene igual) ---
  return (
    <Layout title="FleetGuard360" subtitle="Registro de Usuario">
      <div className="max-w-xl mx-auto">
        <Card className="shadow-elegant bg-gradient-card border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              <UserPlus className="h-8 w-8 text-bus-primary" />
            </div>
            <CardTitle className="text-2xl">Crear Cuenta Nueva</CardTitle>
            <CardDescription>
              Completa todos los campos para registrarte en FleetGuard360
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              
              <div className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    className={errors.nombre ? "border-bus-danger focus:ring-bus-danger" : ""}
                    placeholder="Tu nombre"
                    aria-describedby={errors.nombre ? "nombre-error" : undefined}
                    aria-invalid={!!errors.nombre}
                  />
                  <ErrorMessage field="nombre" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange("apellido", e.target.value)}
                    className={errors.apellido ? "border-bus-danger focus:ring-bus-danger" : ""}
                    placeholder="Tu apellido"
                    aria-describedby={errors.apellido ? "apellido-error" : undefined}
                    aria-invalid={!!errors.apellido}
                  />
                  <ErrorMessage field="apellido" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={errors.username ? "border-bus-danger focus:ring-bus-danger" : ""}
                  placeholder="Ingresa tu nombre de usuario"
                  aria-describedby={errors.username ? "username-error" : undefined}
                  aria-invalid={!!errors.username}
                />
                <ErrorMessage field="username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-bus-danger focus:ring-bus-danger" : ""}
                  placeholder="Ingresa tu número de teléfono"
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  aria-invalid={!!errors.phone}
                />
                <ErrorMessage field="phone" />
              </div>

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
                <ErrorMessage field="email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-bus-danger focus:ring-bus-danger" : ""}
                  placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                />
                <ErrorMessage field="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-bus-danger focus:ring-bus-danger" : ""}
                  placeholder="Confirma tu contraseña"
                  aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                  aria-invalid={!!errors.confirmPassword}
                />
                <ErrorMessage field="confirmPassword" />
              </div>

              <Button
                type="submit"
                className="w-full mt-6 bg-accent hover:bg-accent-hover text-accent-foreground shadow-button transition-smooth"
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrarse"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
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

export default Register;