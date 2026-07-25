import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/receipts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/receipts"!</div>
}
