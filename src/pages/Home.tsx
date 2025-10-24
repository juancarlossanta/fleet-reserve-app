import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Shield, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const Home = () => {
  return (
    <Layout title="FleetGuard360" subtitle="Sistema de Reservas de Tiquetes de Bus">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-8 py-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Viaja con Confianza
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Reserva tus tiquetes de bus de forma rápida, segura y confiable. 
              Conectamos destinos por toda Colombia con el mejor servicio de transporte.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-accent hover:bg-accent-hover text-accent-foreground shadow-button transition-smooth px-8 py-6 text-lg"
            >
              <Link to="/login">
                Iniciar Sesión
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-smooth px-8 py-6 text-lg"
            >
              <Link to="/register">
                Registrarse
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <Bus className="h-8 w-8 text-bus-primary" />
              </div>
              <CardTitle className="text-xl">Flota Moderna</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Buses cómodos y seguros equipados con las mejores tecnologías para tu viaje.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-bus-success/10 p-3 rounded-full w-fit">
                <Shield className="h-8 w-8 text-bus-success" />
              </div>
              <CardTitle className="text-xl">Reserva Segura</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Sistema de reservas protegido con los más altos estándares de seguridad.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-bus-warning/10 p-3 rounded-full w-fit">
                <Clock className="h-8 w-8 text-bus-warning" />
              </div>
              <CardTitle className="text-xl">Puntualidad</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Horarios precisos y cumplimiento garantizado en todos nuestros destinos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-accent/10 p-3 rounded-full w-fit">
                <MapPin className="h-8 w-8 text-bus-accent" />
              </div>
              <CardTitle className="text-xl">Cobertura Nacional</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Conectamos las principales ciudades de Colombia con rutas directas.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        {/* Info Section */}
        <section className="text-center space-y-6 py-8">
          <h3 className="text-3xl font-bold text-foreground">
            ¿Listo para tu próximo viaje?
          </h3>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Únete a miles de pasajeros que confían en FleetGuard360 para sus viajes. 
            Crea tu cuenta y comienza a reservar tiquetes de forma fácil y segura.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default Home;