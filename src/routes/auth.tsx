import HomeSidebar from '#/components/HomeSidebar/HomeSidebar';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute('/auth')({
  beforeLoad: ({ context }) => {
    // Redirect unauthenticated users to /sign-in
    if (!context.userId) {
      throw redirect({ to: '/' })
    }
  },
  component: () => <RouteComponent />,
})

function RouteComponent() {
  return (
    <div>
      <SidebarProvider>
        <HomeSidebar />
        <main className='p-5'>
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  )
}
