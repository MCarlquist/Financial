import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { uploadImage } from '#/server/upload'
import { getReceipts, saveReceipt, deleteReceipt, type SaveReceiptInput } from '#/server/receipts'
import { base64Converter } from '#/utils/base64Converter'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Calendar,
  Tag,
  ReceiptText,
  AlertCircle,
  Sparkles,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react'

export const Route = createFileRoute('/auth/receipts')({
  loader: async () => await getReceipts(),
  component: RouteComponent,
})

const CATEGORY_OPTIONS = [
  'Dining & Food',
  'Groceries',
  'Transportation & Fuel',
  'Shopping & Retail',
  'Utilities & Bills',
  'Entertainment',
  'Travel',
  'Healthcare',
  'Services',
  'Other',
]

function RouteComponent() {
  const router = useRouter()
  const savedReceipts = Route.useLoaderData()

  const saveReceiptFn = useServerFn(saveReceipt)
  const deleteReceiptFn = useServerFn(deleteReceipt)

  const [file, setFile] = useState<File | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Editable confirmation form state
  const [editableAnalysis, setEditableAnalysis] = useState<SaveReceiptInput | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList && fileList.length > 0) {
      setFile(fileList[0])
    } else {
      setFile(null)
    }
  }

  const handleAnalyzeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) return

    setIsAnalyzing(true)
    setAnalysisError(null)
    setSaveSuccess(null)

    try {
      const imageBase64 = await base64Converter(file)
      const result = await uploadImage({
        data: {
          image: imageBase64,
        },
      })

      setEditableAnalysis({
        merchantName: result.merchantName || '',
        date: result.date || new Date().toISOString().split('T')[0],
        time: result.time || '',
        currency: result.currency || 'SEK',
        subtotal: result.subtotal ?? 0,
        taxAmount: result.taxAmount ?? 0,
        tipAmount: result.tipAmount ?? 0,
        totalAmount: result.totalAmount ?? 0,
        paymentMethod: result.paymentMethod || '',
        category: result.category || 'Other',
        notes: result.summary || '',
        confidenceScore: result.confidenceScore ?? 1.0,
        summary: result.summary || '',
        items: (result.items || []).map((item) => ({
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? item.totalPrice,
          totalPrice: item.totalPrice,
        })),
        rawAIResponse: result,
      })

      setIsOpen(false)
    } catch (error: any) {
      console.error('Failed to analyze receipt:', error)
      setAnalysisError(error?.message || 'Failed to analyze receipt image. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleItemChange = (
    index: number,
    field: keyof SaveReceiptInput['items'][number],
    value: string | number
  ) => {
    if (!editableAnalysis) return

    const updatedItems = [...editableAnalysis.items]
    const item = { ...updatedItems[index] }

    if (field === 'description') {
      item.description = String(value)
    } else if (field === 'quantity') {
      item.quantity = Number(value)
      if (item.unitPrice !== undefined) {
        item.totalPrice = Number((item.quantity * item.unitPrice).toFixed(2))
      }
    } else if (field === 'unitPrice') {
      item.unitPrice = Number(value)
      item.totalPrice = Number(((item.quantity || 1) * item.unitPrice).toFixed(2))
    } else if (field === 'totalPrice') {
      item.totalPrice = Number(value)
    }

    updatedItems[index] = item

    // Recalculate total if needed
    const newTotal = updatedItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)

    setEditableAnalysis({
      ...editableAnalysis,
      items: updatedItems,
      totalAmount: Number(newTotal.toFixed(2)),
    })
  }

  const handleAddItem = () => {
    if (!editableAnalysis) return
    setEditableAnalysis({
      ...editableAnalysis,
      items: [
        ...editableAnalysis.items,
        {
          description: 'New Item',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    })
  }

  const handleRemoveItem = (index: number) => {
    if (!editableAnalysis) return
    const updatedItems = editableAnalysis.items.filter((_, i) => i !== index)
    const newTotal = updatedItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)

    setEditableAnalysis({
      ...editableAnalysis,
      items: updatedItems,
      totalAmount: Number(newTotal.toFixed(2)),
    })
  }

  const handleConfirmSave = async () => {
    if (!editableAnalysis) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await saveReceiptFn({ data: editableAnalysis })
      setSaveSuccess('Receipt successfully saved to database!')
      setEditableAnalysis(null)
      setFile(null)
      router.invalidate()
    } catch (err: any) {
      console.error('Failed to save receipt to Prisma:', err)
      setSaveError(
        err?.message || 'Failed to save receipt to Prisma. Please ensure you are logged in.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteReceipt = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteReceiptFn({ data: { id } })
      router.invalidate()
    } catch (err: any) {
      console.error('Failed to delete receipt:', err)
      alert(err?.message || 'Failed to delete receipt.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipt Analyzer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Scan receipts with Gemini AI, confirm extracted details, and persist financial data in Prisma.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow">
              <Sparkles className="w-4 h-4 mr-2" />
              Scan New Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Receipt Image</DialogTitle>
              <DialogDescription>
                Select a PNG or JPEG receipt image to automatically extract financial data using AI.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAnalyzeSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="receipt-file">Select Image File</Label>
                <Input
                  id="receipt-file"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </div>

              {analysisError && (
                <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={!file || isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    'Analyze Receipt'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {saveSuccess && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{saveSuccess}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSaveSuccess(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Confirmation & Edit Panel */}
      {editableAnalysis && (
        <Card className="border-2 border-primary/20 shadow-lg bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Review & Confirm Receipt Analysis
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  AI analysis completed with{' '}
                  <span className="font-semibold text-foreground">
                    {Math.round((editableAnalysis.confidenceScore || 1) * 100)}% confidence
                  </span>
                  . Review or edit the values below before storing in Prisma.
                </CardDescription>
              </div>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary self-start sm:self-center">
                Pending Confirmation
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {saveError && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* General Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchantName" className="text-xs font-semibold">
                  Merchant / Vendor
                </Label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="merchantName"
                    value={editableAnalysis.merchantName || ''}
                    onChange={(e) =>
                      setEditableAnalysis({ ...editableAnalysis, merchantName: e.target.value })
                    }
                    className="pl-9"
                    placeholder="Store or Vendor Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="text-xs font-semibold">
                  Purchase Date
                </Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={editableAnalysis.date || ''}
                    onChange={(e) =>
                      setEditableAnalysis({ ...editableAnalysis, date: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-semibold">
                  Category
                </Label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <select
                    id="category"
                    value={editableAnalysis.category || 'Other'}
                    onChange={(e) =>
                      setEditableAnalysis({ ...editableAnalysis, category: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  Currency
                </Label>
                <Input
                  id="currency"
                  value={editableAnalysis.currency || 'SEK'}
                  onChange={(e) =>
                    setEditableAnalysis({ ...editableAnalysis, currency: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SEK, USD, EUR"
                />
              </div>
            </div>

            {/* Financial Amounts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="subtotal" className="text-xs font-semibold">
                  Subtotal
                </Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={editableAnalysis.subtotal ?? 0}
                  onChange={(e) =>
                    setEditableAnalysis({
                      ...editableAnalysis,
                      subtotal: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAmount" className="text-xs font-semibold">
                  Tax / VAT
                </Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  value={editableAnalysis.taxAmount ?? 0}
                  onChange={(e) =>
                    setEditableAnalysis({
                      ...editableAnalysis,
                      taxAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount" className="text-xs font-semibold text-primary">
                  Total Amount
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={editableAnalysis.totalAmount ?? 0}
                  onChange={(e) =>
                    setEditableAnalysis({
                      ...editableAnalysis,
                      totalAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="font-bold text-base"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Notes / Summary
              </Label>
              <Textarea
                id="notes"
                rows={2}
                value={editableAnalysis.notes || ''}
                onChange={(e) =>
                  setEditableAnalysis({ ...editableAnalysis, notes: e.target.value })
                }
                placeholder="Notes or overview..."
              />
            </div>

            {/* Line Items Editor */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ReceiptText className="w-4 h-4" />
                  Line Items ({editableAnalysis.items.length})
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Line Item
                </Button>
              </div>

              {editableAnalysis.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No line items extracted.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                    <span className="col-span-5">Item Description</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Unit Price</span>
                    <span className="col-span-2 text-right">Total</span>
                    <span className="col-span-1 text-center">Action</span>
                  </div>
                  {editableAnalysis.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-md">
                      <div className="col-span-5">
                        <Input
                          size={1}
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Item name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="h-8 text-xs text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice ?? 0}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.totalPrice ?? 0}
                          onChange={(e) => handleItemChange(idx, 'totalPrice', e.target.value)}
                          className="h-8 text-xs text-right font-semibold"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 border-t p-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditableAnalysis(null)
              }}
              disabled={isSaving}
            >
              Discard Analysis
            </Button>

            <Button type="button" onClick={handleConfirmSave} disabled={isSaving} className="shadow-md">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Storing in Prisma...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm & Store in Database
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Saved Receipts Listing from Prisma */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Stored Receipts in Database ({savedReceipts.length})
          </h2>
        </div>

        {savedReceipts.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ReceiptText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No Stored Receipts Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Scan a receipt image above and confirm the analysis to store financial records in Prisma.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savedReceipts.map((receipt) => (
              <Card key={receipt.id} className="hover:border-primary/40 transition-colors shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">
                          {receipt.merchant?.name || 'Unknown Merchant'}
                        </CardTitle>
                        {receipt.status && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {receipt.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {receipt.purchaseDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(receipt.purchaseDate).toLocaleDateString()}
                          </span>
                        )}
                        {receipt.items && receipt.items.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ReceiptText className="w-3.5 h-3.5" />
                            {receipt.items.length} item{receipt.items.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-start gap-4">
                      <div>
                        <div className="text-2xl font-extrabold text-foreground">
                          {receipt.currency} {receipt.total.toFixed(2)}
                        </div>
                        {receipt.tax !== null && (
                          <p className="text-xs text-muted-foreground">
                            Tax: {receipt.currency} {receipt.tax.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteReceipt(receipt.id)}
                        disabled={deletingId === receipt.id}
                        title="Delete receipt"
                      >
                        {deletingId === receipt.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 text-sm space-y-3">
                  {receipt.notes && (
                    <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                      {receipt.notes}
                    </p>
                  )}

                  {receipt.items && receipt.items.length > 0 && (
                    <div className="space-y-1 pt-1 border-t">
                      <div className="divide-y text-xs">
                        {receipt.items.map((item) => (
                          <div key={item.id} className="py-1.5 flex justify-between items-center">
                            <span className="font-medium text-foreground">
                              {item.quantity > 1 ? `${item.quantity}x ` : ''}
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.category?.name && (
                                <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded font-medium">
                                  {item.category.name}
                                </span>
                              )}
                              <span className="font-semibold">
                                {receipt.currency} {item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
