"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Store,
  Package,
  CheckCircle,
  DollarSign,
  ArrowLeft,
  Eye,
  ShoppingCart,
  Users,
  RefreshCw,
  Star,
  Search,
  QrCode,
  TrendingUp,
  Edit,
} from "lucide-react"
import { sharedDataStore, type BatchData } from "@/store/supply-chain"

export default function RetailerDashboard() {
  const [batches, setBatches] = useState<BatchData[]>([])
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null)
  const [retailPrice, setRetailPrice] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([])
  const [detailViewBatch, setDetailViewBatch] = useState<BatchData | null>(null)
  const [priceUpdateBatch, setPriceUpdateBatch] = useState<BatchData | null>(null)
  const [newPrice, setNewPrice] = useState("")

  useEffect(() => {
    const updateBatches = () => {
      const allBatches = sharedDataStore.getAllBatches()
      const retailerBatches = allBatches.filter((batch) =>
        ["Delivered", "Ready for Sale", "Sold"].includes(batch.status),
      )
      setBatches(retailerBatches)
      setFilteredBatches(retailerBatches)
    }

    updateBatches()
    const unsubscribe = sharedDataStore.subscribe(updateBatches)

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBatches(batches)
    } else {
      const filtered = batches.filter(
        (batch) =>
          batch.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          batch.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
          batch.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          batch.farmLocation.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredBatches(filtered)
    }
  }, [searchQuery, batches])

  const handleQRScan = () => {
    const sampleLotNumbers = batches.map((b) => b.lotNumber)
    if (sampleLotNumbers.length > 0) {
      const randomLot = sampleLotNumbers[Math.floor(Math.random() * sampleLotNumbers.length)]
      setSearchQuery(randomLot)
    }
  }

  const handleMakeAvailable = async (batchId: string) => {
    setIsUpdating(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const updates: Partial<BatchData> = {
      status: "Ready for Sale" as const,
    }

    let priceNote = "Quality approved and made available for consumers"

    if (retailPrice) {
      const originalPrice = selectedBatch?.price || "$0"
      updates.price = `$${retailPrice}`
      priceNote = `Retail price set to $${retailPrice} (Original farm price: ${originalPrice}). Quality approved and made available for consumers`
    }

    sharedDataStore.updateBatch(batchId, updates, "Fresh Market Co.", priceNote)

    setIsUpdating(false)
    setRetailPrice("")
    setSelectedBatch(null)
  }

  const handlePriceUpdate = async (batchId: string) => {
    if (!newPrice || !priceUpdateBatch) return

    setIsUpdating(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const originalPrice = priceUpdateBatch.price
    const priceNote = `Price updated from ${originalPrice} to $${newPrice} by retailer`

    sharedDataStore.updateBatch(batchId, { price: `$${newPrice}` }, "Fresh Market Co.", priceNote)

    setIsUpdating(false)
    setNewPrice("")
    setPriceUpdateBatch(null)
  }

  const handleMarkSold = async (batchId: string) => {
    setIsUpdating(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    sharedDataStore.updateBatch(batchId, { status: "Sold" }, "Fresh Market Co.", "Successfully sold to consumer")

    setIsUpdating(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-blue-500"
      case "Ready for Sale":
        return "bg-green-500"
      case "Sold":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getActionButton = (batch: BatchData) => {
    switch (batch.status) {
      case "Delivered":
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setSelectedBatch(batch)}>
                <Store className="w-4 h-4 mr-2" />
                Make Available
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Available for Sale</DialogTitle>
                <DialogDescription>
                  Set retail price and make available to consumers - {batch.lotNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Crop:</span> {batch.crop}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span> {batch.weight}
                  </div>
                  <div>
                    <span className="font-medium">Quality:</span> {batch.quality}
                  </div>
                  <div>
                    <span className="font-medium">Farm Price:</span> {batch.price}
                  </div>
                </div>

                <div>
                  <Label htmlFor="retail-price">Retail Price (Optional)</Label>
                  <Input
                    id="retail-price"
                    type="number"
                    placeholder="Enter retail price..."
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep farm price. This will be recorded on the blockchain.
                  </p>
                </div>

                <Button onClick={() => handleMakeAvailable(batch.id)} disabled={isUpdating} className="w-full">
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Recording on Blockchain...
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4 mr-2" />
                      Make Available for Sale
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )
      case "Ready for Sale":
        return (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPriceUpdateBatch(batch)
                    setNewPrice(batch.price.replace("$", ""))
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Retail Price</DialogTitle>
                  <DialogDescription>
                    Change the retail price for {batch.lotNumber} - This will be recorded on the blockchain
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium">Current Price:</span> {batch.price}
                    </div>
                    <div>
                      <span className="font-medium">Crop:</span> {batch.crop}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-price">New Retail Price</Label>
                    <Input
                      id="new-price"
                      type="number"
                      placeholder="Enter new price..."
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Price change will be tracked in blockchain history</p>
                  </div>

                  <Button
                    onClick={() => handlePriceUpdate(batch.id)}
                    disabled={isUpdating || !newPrice}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Recording Price Change...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Update Price on Blockchain
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={() => handleMarkSold(batch.id)} disabled={isUpdating}>
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              Mark as Sold
            </Button>
          </div>
        )
      case "Sold":
        return (
          <Badge className="bg-purple-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sold
          </Badge>
        )
      default:
        return null
    }
  }

  const totalRevenue = batches
    .filter((b) => b.status === "Sold")
    .reduce((sum, batch) => sum + Number(batch.price.replace(/[$,]/g, "")), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              className="text-lg hover:bg-purple-50 transition-colors duration-300 group"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Home
            </Button>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Retailer Dashboard
              </h1>
              <p className="text-purple-600 text-sm md:text-base">Fresh Market Co. - Retail Operations & Pricing</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 text-lg bg-purple-100 text-purple-700">
                Store #FM-001
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg bg-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New Deliveries</CardTitle>
              <Package className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batches.filter((b) => b.status === "Delivered").length}</div>
              <p className="text-xs text-gray-500">Ready to process</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Available for Sale</CardTitle>
              <Store className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batches.filter((b) => b.status === "Ready for Sale").length}</div>
              <p className="text-xs text-gray-500">On shelves now</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Items Sold</CardTitle>
              <ShoppingCart className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batches.filter((b) => b.status === "Sold").length}</div>
              <p className="text-xs text-gray-500">This week</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Total sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Management */}
        <Card className="shadow-xl bg-gradient-to-br from-white to-purple-50/30 border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl text-purple-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  Inventory & Pricing Management
                </CardTitle>
                <CardDescription className="text-base">
                  Manage deliveries, set prices, and track blockchain records
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="bg-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="flex gap-3 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by lot number, crop, farmer, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQRScan}
                className="bg-white hover:bg-purple-50 border-purple-200"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {searchQuery ? "No matching inventory items" : "No inventory items"}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery ? "Try adjusting your search terms" : "Waiting for new deliveries from distributors"}
                  </p>
                </div>
              ) : (
                filteredBatches.map((batch, index) => (
                  <div
                    key={batch.id}
                    className="p-6 bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 rounded-2xl border-2 border-purple-100 hover:border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                      <div className="flex items-center gap-4 mb-4 lg:mb-0">
                        <div className="text-5xl bg-white rounded-2xl p-3 shadow-md">{batch.crop.split(" ")[0]}</div>
                        <div>
                          <h4 className="text-xl md:text-2xl font-bold text-gray-800">{batch.crop.split(" ")[1]}</h4>
                          <p className="text-purple-600 font-bold text-lg">{batch.weight}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Lot: {batch.lotNumber}
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-500">{batch.quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-2xl md:text-3xl font-bold text-green-700 mb-2">{batch.price}</p>
                        <Badge className={`${getStatusColor(batch.status)} text-white`}>
                          {batch.status === "Ready for Sale" && <Store className="w-3 h-3 mr-1" />}
                          {batch.status === "Delivered" && <Package className="w-3 h-3 mr-1" />}
                          {batch.status === "Sold" && <ShoppingCart className="w-3 h-3 mr-1" />}
                          {batch.status}
                        </Badge>
                      </div>
                    </div>

                    {batch.status === "Ready for Sale" && (
                      <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <p className="font-bold mb-2 text-green-700 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Consumer Information & Pricing History
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Farm Origin:</span>
                            <p className="text-green-600">{batch.farmLocation}</p>
                          </div>
                          <div>
                            <span className="font-medium">Harvest Date:</span>
                            <p className="text-green-600">{new Date(batch.harvestDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Blockchain Verified:</span>
                            <p className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Price & Quality Tracked
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      {getActionButton(batch)}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-white hover:bg-purple-50 border-purple-200 hover:border-purple-300 transition-all duration-300"
                            onClick={() => setDetailViewBatch(batch)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Batch Details - {batch.lotNumber}</DialogTitle>
                            <DialogDescription>Complete supply chain and pricing information</DialogDescription>
                          </DialogHeader>
                          {detailViewBatch && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-purple-700">Product Information</h4>
                                  <div className="text-sm space-y-1">
                                    <p>
                                      <span className="font-medium">Crop:</span> {detailViewBatch.crop}
                                    </p>
                                    <p>
                                      <span className="font-medium">Weight:</span> {detailViewBatch.weight}
                                    </p>
                                    <p>
                                      <span className="font-medium">Quality:</span> {detailViewBatch.quality}
                                    </p>
                                    <p>
                                      <span className="font-medium">Current Price:</span> {detailViewBatch.price}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-purple-700">Farm Information</h4>
                                  <div className="text-sm space-y-1">
                                    <p>
                                      <span className="font-medium">Farmer:</span> {detailViewBatch.farmer}
                                    </p>
                                    <p>
                                      <span className="font-medium">Location:</span> {detailViewBatch.farmLocation}
                                    </p>
                                    <p>
                                      <span className="font-medium">Harvest Date:</span>{" "}
                                      {new Date(detailViewBatch.harvestDate).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-semibold text-purple-700">Supply Chain & Pricing History</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {detailViewBatch.trackingHistory.map((entry, idx) => (
                                    <div key={idx} className="p-3 bg-purple-50 rounded-lg text-sm">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium">{entry.updatedBy}</p>
                                          <p className="text-gray-600">{entry.note}</p>
                                          <Badge className="mt-1 text-xs">{entry.status}</Badge>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {new Date(entry.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-semibold text-purple-700">Blockchain Verification</h4>
                                <div className="p-3 bg-green-50 rounded-lg text-sm">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-700">
                                      Verified Authentic & Price Tracked
                                    </span>
                                  </div>
                                  <p className="text-gray-600 mt-1">
                                    This product and all pricing changes have been verified through blockchain
                                    technology and meet all quality standards.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
