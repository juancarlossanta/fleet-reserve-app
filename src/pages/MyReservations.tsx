import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea"; // Se asume este componente existe en el frontend
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Se asume este componente existe en el frontend
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Bus,
  XCircle,
  CheckCircle,
  RotateCcw,
  Info,
  Route,
  ArrowLeft,
  Ticket,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, isBefore, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "recharts";

// --- Configuración GraphQL y Endpoint (Mismos que el ejemplo) ---
const GRAPHQL_ENDPOINT = 'http://localhost:8080/graphql';
const ITEMS_PER_PAGE = 5; // Menos reservas por página para mis reservas

// --- Definiciones de Interfaz Específicas para Reservas ---

// Interfaz para un pasajero de la reserva
interface Pasajero {
  nombre: string;
  documento: string;
}

// Interfaz para una reserva
interface Reserva {
  id: string;
  fechaViaje: string; // YYYY-MM-DD
  horaSalida: string; // HH:MM
  ruta: string; // Nombre de la ruta, e.g., "Ruta Expreso 101"
  paradas: string[]; // Listado de paradas
  busAsignado: string; // Placa del bus
  asientosTomados: string[]; // Números de asiento, e.g., ["A1", "A2"]
  pasajeros: Pasajero[]; // Detalle de pasajeros
  estado: 'Activa' | 'Completada' | 'Cancelada';
  origen: string;
  destino: string;
}

// 2. Definir la consulta de GraphQL para obtener las reservas de un usuario (simulada)
// Se asume un ID de usuario o un token de sesión para la consulta real.
const GET_MY_RESERVATIONS_QUERY = `
  query GetMyReservations($userId: ID!) {
    reservas(userId: $userId) {
      id
      fechaViaje
      horaSalida
      ruta
      paradas
      busAsignado
      asientosTomados
      pasajeros {
        nombre
        documento
      }
      estado
      origen
      destino
    }
  }
`;

// 3. Definir la mutación para cancelar una reserva
const CANCEL_RESERVATION_MUTATION = `
  mutation CancelReservation($reservaId: ID!, $motivo: String) {
    cancelarReserva(reservaId: $reservaId, motivo: $motivo) {
      id
      estado
    }
  }
`;

// --- Función de Petición GraphQL (Misma que el ejemplo) ---
async function executeGraphQLQuery(query: string, variables: any = {}): Promise<any> {
    const maxRetries = 3;
    let attempt = 0;
  
    while (attempt < maxRetries) {
      try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Asume que la autenticación está en el header 'Authorization'
            'Authorization': 'Bearer ' + 'TOKEN_DE_USUARIO_SIMULADO', 
          },
          body: JSON.stringify({
            query: query,
            variables: variables,
          }),
        });
  
        const result = await response.json();
  
        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Error desconocido en GraphQL');
        }
  
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
  
        return result.data;
  
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    throw new Error("Fallo la petición después de múltiples reintentos.");
}

// --- Componente MyReservations (Mis Reservas) ---

const MyReservations = () => {
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  
  // Estado para el cuadro de diálogo de cancelación
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Datos simulados (para inicialización o fallback)
  const simulatedReservations: Reserva[] = useMemo(() => ([
    {
      id: "RES-001",
      fechaViaje: "2025-11-10",
      horaSalida: "08:00",
      ruta: "Ruta 1 - Central",
      paradas: ["Bogotá", "Girardot", "Ibagué"],
      busAsignado: "XYZ-123",
      asientosTomados: ["A1", "A2"],
      pasajeros: [{ nombre: "Juan Pérez", documento: "1000" }, { nombre: "María Gómez", documento: "1001" }],
      estado: 'Activa',
      origen: "Bogotá",
      destino: "Ibagué",
    },
    {
      id: "RES-002",
      fechaViaje: "2025-10-01",
      horaSalida: "14:30",
      ruta: "Ruta 2 - Costeña",
      paradas: ["Medellín", "Sincelejo", "Cartagena"],
      busAsignado: "ABC-456",
      asientosTomados: ["C5"],
      pasajeros: [{ nombre: "Carlos Diaz", documento: "1002" }],
      estado: 'Completada',
      origen: "Medellín",
      destino: "Cartagena",
    },
    {
      id: "RES-003",
      fechaViaje: "2025-10-25",
      horaSalida: "22:00",
      ruta: "Ruta 3 - Frontera",
      paradas: ["Cali", "Pasto", "Ipiales"],
      busAsignado: "DEF-789",
      asientosTomados: ["D1", "D2", "D3", "D4"],
      pasajeros: [{ nombre: "Ana López", documento: "1003" }, { nombre: "Pedro Rey", documento: "1004" }, { nombre: "Sara Sol", documento: "1005" }, { nombre: "Luis Luna", documento: "1006" }],
      estado: 'Activa',
      origen: "Cali",
      destino: "Ipiales",
    },
    {
      id: "RES-004",
      fechaViaje: "2025-11-05",
      horaSalida: "06:00",
      ruta: "Ruta 4 - Eje Cafetero",
      paradas: ["Pereira", "Armenia", "Manizales"],
      busAsignado: "GHI-012",
      asientosTomados: ["B3"],
      pasajeros: [{ nombre: "Jairo N.", documento: "1007" }],
      estado: 'Activa',
      origen: "Pereira",
      destino: "Manizales",
    },
    {
      id: "RES-005",
      fechaViaje: "2025-10-20",
      horaSalida: "10:00",
      ruta: "Ruta 1 - Central",
      paradas: ["Bogotá", "Girardot", "Ibagué"],
      busAsignado: "XYZ-123",
      asientosTomados: ["A3"],
      pasajeros: [{ nombre: "Fernanda", documento: "1008" }],
      estado: 'Cancelada',
      origen: "Bogotá",
      destino: "Ibagué",
    },
  ]), []); // Dependencia vacía para que solo se cree una vez

  // Función para obtener las reservas (simulada)
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    // Simulación de una llamada GraphQL real
    try {
        // const data = await executeGraphQLQuery(GET_MY_RESERVATIONS_QUERY, { userId: "USER_ID_ACTUAL" });
        // setReservations(data.reservas || []);
        
        // Usamos los datos simulados por simplicidad
        const sortedReservations = [...simulatedReservations].sort((a, b) => {
            // Ordenar primero por estado (Activa primero) y luego por fecha/hora
            if (a.estado === 'Activa' && b.estado !== 'Activa') return -1;
            if (a.estado !== 'Activa' && b.estado === 'Activa') return 1;

            const dateA = parseISO(`${a.fechaViaje}T${a.horaSalida}:00`);
            const dateB = parseISO(`${b.fechaViaje}T${b.horaSalida}:00`);

            if (a.estado === 'Activa') {
                return isBefore(dateA, dateB) ? -1 : 1; // Activas: más cercanas primero
            } else {
                return isBefore(dateA, dateB) ? 1 : -1; // Histórico: más recientes primero
            }
        });

        setReservations(sortedReservations);
        toast({ title: "Reservas cargadas", description: `Se encontraron ${sortedReservations.length} reservas.` });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido al cargar reservas.";
        console.error("Error al cargar reservas:", error);
        toast({
            title: "Error de Carga",
            description: `No se pudieron obtener sus reservas. ${message}`,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [simulatedReservations, toast]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Manejadores de Estado y Paginación
  const totalPages = Math.ceil(reservations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentResults = reservations.slice(startIndex, endIndex);

  const getStatusBadge = (estado: Reserva['estado']) => {
    switch (estado) {
      case 'Activa':
        return <Badge className="bg-bus-success hover:bg-bus-success/90 text-white border-0"><CheckCircle className="h-3 w-3 mr-1" /> Activa</Badge>;
      case 'Completada':
        return <Badge variant="secondary"><Info className="h-3 w-3 mr-1" /> Completada</Badge>;
      case 'Cancelada':
        return <Badge className="bg-bus-danger hover:bg-bus-danger/90 text-white border-0"><XCircle className="h-3 w-3 mr-1" /> Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const isCancelable = (reserva: Reserva) => {
    if (reserva.estado !== 'Activa') return false;

    // "Se permite cancelar hasta la hora de salida"
    const departureTime = parseISO(`${reserva.fechaViaje}T${reserva.horaSalida}:00`);
    return isBefore(new Date(), departureTime);
  };
  
  // Lógica de cancelación
  const handleInitiateCancel = (reservaId: string) => {
    setSelectedReservationId(reservaId);
    setCancelReason("");
    setIsCancelDialogOpen(true);
  };

  const handleCancelReservation = async () => {
    if (!selectedReservationId) return;

    setIsCancelling(true);
    try {
        // Ejecutar mutación GraphQL para cancelar
        // const data = await executeGraphQLQuery(CANCEL_RESERVATION_MUTATION, { 
        //     reservaId: selectedReservationId, 
        //     motivo: cancelReason 
        // });
        
        // Simulación: Cambiar el estado en el frontend si es exitoso
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simular latencia
        
        setReservations(prev => prev.map(res => 
            res.id === selectedReservationId ? { ...res, estado: 'Cancelada' } : res
        ));

        toast({ 
            title: "Reserva Cancelada", 
            description: `La reserva ${selectedReservationId} ha sido cancelada exitosamente.`,
            variant: "default"
        });
        
        // Recargar para ordenar si es necesario, o simplemente cerrar y actualizar estado
        fetchReservations(); 

    } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido al cancelar.";
        console.error("Error en la cancelación de GraphQL:", error);
        toast({
            title: "Fallo la Cancelación",
            description: `No se pudo cancelar la reserva. ${message}`,
            variant: "destructive",
        });
    } finally {
        setIsCancelling(false);
        setIsCancelDialogOpen(false);
        setSelectedReservationId(null);
        setCancelReason("");
    }
  };
  
  // Renderizado del componente principal

  const navigate = useNavigate();
  return (
    <Layout title="FleetGuard360" subtitle="Mis Reservas">
      <div className="max-w-6xl mx-auto space-y-8">

        <Button
            variant="ghost"
            onClick={() => navigate('/search')}
            className="text-bus-primary hover:bg-bus-primary/10 font-semibold"
            disabled={isLoading}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Búsqueda
        </Button>
        
        {/* Política de Cancelación */}
        <Card className="shadow-card bg-gradient-card border-bus-warning border-l-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-bus-warning">
                    <Info className="h-5 w-5" /> Política de Cancelación
                </CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-bus-warning/80">
                    Se permite cancelar hasta la hora de salida del viaje; no se cobran penalidades en este alcance.
                </CardDescription>
            </CardContent>
        </Card>

        {/* Listado de Resultados */}
        <Card className="shadow-card bg-background/50 border-0">
          <CardHeader>
            <CardTitle className="text-xl">
              Listado de Reservas
              {reservations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {reservations.length} encontradas
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Aquí encontrarás el detalle de todas tus reservas, activas e históricas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? ( 
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-40 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : currentResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                    Aún no tienes reservas registradas.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    ¡Busca tu primer viaje!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentResults.map((reserva) => (
                  <Card key={reserva.id} className="shadow-card border hover:shadow-elegant transition-smooth">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-4 gap-4 items-center">
                        
                        {/* Estado y Ruta */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                {getStatusBadge(reserva.estado)}
                                <span className="text-sm text-muted-foreground font-semibold">#{reserva.id}</span>
                            </div>
                            <div className="flex items-center gap-1 pt-1">
                                <Route className="h-4 w-4 text-bus-primary" />
                                <span className="font-medium text-sm">{reserva.ruta}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Bus className="h-4 w-4" />
                                Bus: <span className="font-medium text-foreground">{reserva.busAsignado}</span>
                            </div>
                        </div>

                        {/* Fecha y Hora */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-bus-primary" />
                                <span className="font-medium">{format(parseISO(reserva.fechaViaje), "PPP", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Hora de Salida: {reserva.horaSalida}</span>
                            </div>
                        </div>

                        {/* Paradas y Asientos */}
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                {reserva.origen} → {reserva.destino}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                Paradas: {reserva.paradas.join(', ')}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Ticket className="h-4 w-4" />
                                Asientos: <span className="font-medium text-foreground">{reserva.asientosTomados.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                Pasajeros: <span className="font-medium text-foreground">{reserva.pasajeros.length}</span>
                            </div>
                        </div>
                        
                        {/* Botón de Cancelar */}
                        <div className="text-right">
                            <Button
                                onClick={() => handleInitiateCancel(reserva.id)}
                                disabled={!isCancelable(reserva)}
                                variant="destructive"
                                className={cn(
                                    "w-full md:w-auto transition-smooth",
                                    !isCancelable(reserva) && "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                                aria-label={`Cancelar reserva ${reserva.id}`}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Cancelar Reserva
                            </Button>
                            {!isCancelable(reserva) && reserva.estado === 'Activa' && (
                                <p className="text-xs text-bus-danger mt-1">
                                    Hora límite de cancelación superada.
                                </p>
                            )}
                            {reserva.estado !== 'Activa' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Solo se cancelan reservas activas.
                                </p>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Componente de Paginación (Similar al del frontend de muestra) */}
            {reservations.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} (Mostrando {currentResults.length} de {reservations.length} reservas)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Anterior</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="mr-2 hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
        
        {/* Cuadro de Diálogo de Confirmación de Cancelación */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-bus-danger flex items-center gap-2">
                        <XCircle className="h-6 w-6" /> ¿Confirmas la cancelación de la reserva #{selectedReservationId}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se te reembolsará el monto total según la política de cancelación ("Se permite cancelar hasta la hora de salida").
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                {/* Solución: Reemplazar <Label htmlFor="..."> por un <div> estilizado */}
                <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Motivo de Cancelación (Opcional)
                </div>
                <Textarea 
                    id="cancel-reason"
                    placeholder="Escribe aquí el motivo si lo deseas (Ej: Cambio de planes)" 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    disabled={isCancelling}
                />
            </div>
            <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>No, Mantener</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleCancelReservation} 
                        className="bg-bus-danger hover:bg-bus-danger/90"
                        disabled={isCancelling}
                    >
                        {isCancelling ? "Cancelando..." : "Sí, Cancelar Reserva"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
      </div>
    </Layout>
  );
};

export default MyReservations;