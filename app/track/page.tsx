"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  QrCode,
  Search,
  Package,
  MapPin,
  Calendar,
  Thermometer,
  Droplets,
  Sun,
  ArrowLeft,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { sharedDataStore, type BatchData } from "@/store/supply-chain"

export default function TrackPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [detailViewBatch, setDetailViewBatch] = useState<BatchData | null>(null)

  useEffect(() => {
    const lotParam = searchParams.get("lot")
    const qrParam = searchParams.get("qr")

    if (lotParam) {
      setSearchQuery(lotParam)
      handleSearch(lotParam)
    } else if (qrParam) {
      setSearchQuery(qrParam)
      handleSearch(qrParam)
    }
  }, [searchParams])

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery
    if (!searchTerm.trim()) return

    setLoading(true)
    setError("")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Try to find batch by lot number first, then by ID
    let foundBatch = sharedDataStore.getBatchByLotNumber(searchTerm)
    if (!foundBatch) {
      foundBatch = sharedDataStore.getBatch(searchTerm)
    }

    if (foundBatch) {
      setBatch(foundBatch)
    } else {
      setError("Batch not found. Please check the lot number or QR code data.")
      setBatch(null)
    }

    setLoading(false)
  }

  const handleQRScan = () => {
    const allBatches = sharedDataStore.getAllBatches()
    if (allBatches.length > 0) {
      const randomBatch = allBatches[Math.floor(Math.random() * allBatches.length)]
      setSearchQuery(randomBatch.lotNumber)
      handleSearch(randomBatch.lotNumber)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing":
        return "bg-yellow-500"
      case "Pending Verification":
        return "bg-blue-500"
      case "In Transit":
        return "bg-purple-500"
      case "Delivered":
        return "bg-green-500"
      case "Ready for Sale":
        return "bg-cyan-500"
      case "Sold":
        return "bg-emerald-500"
      default:
        return "bg-gray-500"
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
      case "Processing":
        return 15
      case "Pending Verification":
        return 25
      case "In Transit":
        return 50
      case "Delivered":
        return 75
      case "Ready for Sale":
        return 90
      case "Sold":
        return 100
      default:
        return 15
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Batch Tracking</h1>
              <p className="text-sm text-muted-foreground">Track your food's journey from farm to fork</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Track Batch
            </CardTitle>
            <CardDescription>Enter a lot number (e.g., LOT-2024-001) or scan QR code data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Enter lot number or QR data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button variant="outline" onClick={handleQRScan} className="hover:bg-primary/10 bg-transparent">
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
              <Button onClick={() => handleSearch()} disabled={loading || !searchQuery.trim()}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-destructive text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Details */}
        {batch && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Batch Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-3">
                        <span className="text-4xl">{batch.crop.split(" ")[0]}</span>
                        {batch.crop.split(" ")[1]}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Lot: {batch.lotNumber} • Weight: {batch.weight}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(batch.status)} text-white`}>{batch.status}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setDetailViewBatch(batch)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Complete Batch Information - {batch.lotNumber}</DialogTitle>
                            <DialogDescription>Full supply chain transparency</DialogDescription>
                          </DialogHeader>
                          {detailViewBatch && (
                            <div className="space-y-6 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-primary">Product Information</h4>
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
                                      <span className="font-medium">Price:</span> {detailViewBatch.price}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-primary">Farm Information</h4>
                                  <div className="text-sm space-y-1">
                                    <p>
                                      <span className="font-medium">Farmer:</span> {detailViewBatch.farmer}
                                    </p>
                                    <p>
                                      <span className="font-medium">Location:</span> {detailViewBatch.farmLocation}
                                    </p>
                                    <p>
                                      <span className="font-medium">Harvest Date:</span>{" "}
                                      {new Date(detailViewBatch.harvestDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-semibold text-primary">Supply Chain History</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {detailViewBatch.supplyChainHistory.map((entry, idx) => (
                                    <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium">{entry.actor}</p>
                                          <p className="text-muted-foreground">{entry.action}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(entry.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {detailViewBatch.iotData && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-primary">IoT Sensor Data</h4>
                                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg text-sm">
                                    <p>
                                      <span className="font-medium">Temperature:</span>{" "}
                                      {detailViewBatch.iotData.temperature}°C
                                    </p>
                                    <p>
                                      <span className="font-medium">Humidity:</span> {detailViewBatch.iotData.humidity}%
                                    </p>
                                    <p>
                                      <span className="font-medium">Soil Moisture:</span>{" "}
                                      {detailViewBatch.iotData.soilMoisture}%
                                    </p>
                                    <p>
                                      <span className="font-medium">GPS:</span> {detailViewBatch.iotData.gpsCoordinates}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3 font-medium">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Farm
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Distributor
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Retailer
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        Consumer
                      </span>
                    </div>
                    <Progress value={getProgressValue(batch.status)} className="h-3" />
                  </div>

                  {/* Key Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Quality:</span>
                        <span className="text-sm">{batch.quality}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Farm:</span>
                        <span className="text-sm">{batch.farmLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Harvested:</span>
                        <span className="text-sm">{new Date(batch.harvestDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Farmer:</span>
                        <span className="text-sm">{batch.farmer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Price:</span>
                        <span className="text-sm font-bold text-green-600">{batch.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Blockchain:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-secondary hover:text-secondary/80"
                          onClick={() => copyToClipboard(batch.blockchain)}
                        >
                          {batch.blockchain.slice(0, 20)}...
                          <Copy className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* IoT Data */}
              {batch.iotData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5" />
                      IoT Sensor Data
                    </CardTitle>
                    <CardDescription>Real-time environmental conditions during growth and transport</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Soil Moisture</p>
                        <p className="text-2xl font-bold text-blue-600">{batch.iotData.soilMoisture}%</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                        <p className="text-2xl font-bold text-red-600">{batch.iotData.temperature}°C</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Humidity</p>
                        <p className="text-2xl font-bold text-yellow-600">{batch.iotData.humidity}%</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">GPS</p>
                        <p className="text-sm font-bold text-purple-600 break-all">{batch.iotData.gpsCoordinates}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Last updated: {new Date(batch.iotData.lastUpdate).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tracking History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Tracking History
                  </CardTitle>
                  <CardDescription>Complete journey from farm to your table</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batch.trackingHistory.map((event, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-foreground">{event.status}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{event.note}</p>
                          <p className="text-xs text-muted-foreground">Updated by: {event.updatedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code & Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code
                  </CardTitle>
                  <CardDescription>Scan to share this batch information</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-muted/50 p-6 rounded-lg mb-4">
                    <img
                      src={batch.qrCode || "/placeholder.svg?height=200&width=200&query=QR code"}
                      alt={`QR Code for ${batch.lotNumber}`}
                      className="mx-auto border-2 border-border rounded-lg"
                      width={200}
                      height={200}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share Batch Info
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Blockchain Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Quality Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">IoT Data Validated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Supply Chain Tracked</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Sample Batches for Demo */}
        {!batch && !loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Try These Sample Batches</CardTitle>
              <CardDescription>Click on any lot number to see the tracking information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedDataStore.getAllBatches().map((sampleBatch) => (
                  <div
                    key={sampleBatch.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSearchQuery(sampleBatch.lotNumber)
                      handleSearch(sampleBatch.lotNumber)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sampleBatch.crop.split(" ")[0]}</span>
                      <div>
                        <p className="font-medium">{sampleBatch.lotNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {sampleBatch.crop.split(" ")[1]} • {sampleBatch.weight}
                        </p>
                        <Badge size="sm" className={`${getStatusColor(sampleBatch.status)} text-white mt-1`}>
                          {sampleBatch.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
