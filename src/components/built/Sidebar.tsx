'use client';

import { useUbicaciones } from "@/hooks/useApi";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  BarChart3,
  Download,
  MapPin,
  Route,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react"



export function AppSidebar() {
  const { data: ubicaciones = [], isLoading: cargando } = useUbicaciones();

  const recentItems = ubicaciones.slice(0, 6);

  return (
    <Sidebar variant="floating" collapsible="icon" className="bg-transparent">
      <SidebarHeader className="gap-3 px-4 pb-2 pt-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-2">
        <div className="flex items-center gap-3">
          {/* We shrink the icon container when collapsed */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm transition-all group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
            <Route className="size-5 transition-all group-data-[collapsible=icon]:size-4" />
          </div>
          {/* Hide text block when collapsed */}
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-heading text-base text-sidebar-foreground">
              Rutas
            </p>
            <p className="text-xs text-sidebar-foreground/60">
          Ferrero
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/50 px-3 py-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          {ubicaciones.length} ubicaciones capturadas hoy
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Mapa en vivo" asChild>
                  <Link href="/">
                    <MapPin />
                    <span>Mapa en vivo</span>
                  </Link>
                </SidebarMenuButton>
                {/* Hide the badge in icon mode to prevent overlap */}
                <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">
                  {ubicaciones.length}
                </SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Vendedores" asChild>
                  <Link href="/vendedores">
                    <Users />
                    <span>Vendedores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Rutas" asChild>
                  <Link href="/rutas">
                    <Route />
                    <span>Rutas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Ubicaciones" asChild>
                  <Link href="/ubicaciones">
                    <MapPin />
                    <span>Ubicaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Solicitudes" asChild>
                  <Link href="/solicitudes">
                    <UserPlus />
                    <span>Solicitudes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Reportes">
                  <BarChart3 />
                  <span>Reportes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Hide the entire 'Capturas recientes' section when collapsed */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarSeparator className="mb-2" />
          <SidebarGroupLabel>Capturas recientes</SidebarGroupLabel>
          <SidebarGroupContent>
            {cargando ? (
              <div className="space-y-2 px-1">
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </div>
            ) : (
              <div className="space-y-2 px-1">
                {recentItems.length ? (
                  recentItems.map((ubicacion) => (
                    <a
                      key={ubicacion.id}
                      href={ubicacion.urlOriginal || "#"}
                      target={ubicacion.urlOriginal ? "_blank" : undefined}
                      rel={ubicacion.urlOriginal ? "noreferrer" : undefined}
                      className="group/card flex flex-col gap-1 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-2 transition hover:border-sidebar-primary/40 hover:bg-sidebar-accent"
                    >
                      <div className="flex items-center justify-start gap-1">
                        <MapPin className="size-3.5 text-sidebar-primary" />
                        <span className="text-sm font-medium text-sidebar-foreground">
                          {ubicacion.nombre}
                        </span>
                      </div>
                      <div className="flex items-center justify-start gap-1">
                      <User className="size-3.5 text-sidebar-primary"></User>
                      <span className="text-xs text-sidebar-foreground/60">
                        {ubicacion.vendedor?.nombreReal || ubicacion.vendedorLid || "Supervisor"}
                      </span>
</div>
                    </a>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-sidebar-border/70 px-3 py-4 text-xs text-sidebar-foreground/60">
                    Aun no hay capturas nuevas.
                  </div>
                )}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Adjust buttons in footer when collapsed (hide text, center icons) */}
      <SidebarFooter className="gap-2 px-4 pb-4 group-data-[collapsible=icon]:px-2">
        <ThemeToggle />
        <Button variant="secondary" size="sm" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Download className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Exportar CSV</span>
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Settings className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Configurar</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}