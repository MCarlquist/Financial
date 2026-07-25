import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/home')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/authenticated/home"!</div>
}
