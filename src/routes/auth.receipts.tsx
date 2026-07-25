import { createFileRoute } from '@tanstack/react-router'
import { ai } from '#/hooks/useHuggingFace'

export const Route = createFileRoute('/auth/receipts')({
  component: RouteComponent,
})

async function RouteComponent() {
  
  const receiptReader = await ai();
  const receipt = await receiptReader.describeReceipt("https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg");
  console.log(receipt);
  
  

  return <div>Hello "/auth/receipts"!</div>
}
