import { Chart } from '#/components/Chart/Chart';
import { Card } from '#/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/home')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='grid grid-cols-4 grid-rows-2 gap-4'>
      <Card className="col-span-2 p-4">
        <h3>Current Balance</h3>
        <p>1.234 sek</p>
      </Card>
      {/* <Card className="col-start-3">2</Card>
      <Card className="col-start-4">3</Card> */}
      <Card className="col-span-3 row-start-2 p-4">
        <h3>Graph</h3>
        <Chart />
      </Card>
      <Card className="col-start-4 row-start-2 p-4">
        <h3>Recent Activity</h3>
        <p>Table</p>
      </Card>
    </div>
  )
}
