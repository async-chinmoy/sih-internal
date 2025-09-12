// pages/FarmerDashboard.tsx (or wherever the component is located)

"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Upload,
  Camera,
  QrCode,
  DollarSign,
  Thermometer,
  Droplets,
  MapPin,
  Leaf,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Sun,
  Download,
  Copy,
  Truck,
  Package,
  Bell,
  BarChart3,
  Calendar,
  Eye,
} from "lucide-react"

// Import the shared data store from the new file
import { sharedDataStore } from "../store/supply-chain"

export default function FarmerDashboard() {
  const [activeStep, setActiveStep] = useState(0)
  const [cropData, setCropData] = useState({
    type: "",
    weight: "",
    harvestDate: "",
  })

  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [recentBatches, setRecentBatches] = useState<any[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const updateBatches = () => {
      setRecentBatches(sharedDataStore.getAllBatches())
    }

    updateBatches()
    const unsubscribe = sharedDataStore.subscribe(updateBatches)

    const eventUnsubscribe = sharedDataStore.onEvent((event: string, data: any) => {
      if (event === "batchUpdated" && data.updates.status) {
        const batch = sharedDataStore.getBatch(data.id)
        if (batch) {
          const message = `${batch.crop} batch ${batch.lotNumber} is now ${data.updates.status}`
          setNotifications((prev) => [message, ...prev.slice(0, 4)])

          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n !== message))
          }, 5000)
        }
      }
    })

    return () => {
      unsubscribe()
      eventUnsubscribe()
    }
  }, [])

  const handleQuickSubmit = async () => {
    if (cropData.type && cropData.weight && cropData.harvestDate) {
      setIsUploading(true)

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newBatch = sharedDataStore.addBatch({
        crop: `${getCropEmoji(cropData.type)} ${cropData.type.charAt(0).toUpperCase() + cropData.type.slice(1)}`,
        weight: `${cropData.weight}kg`,
        farmer: "John Smith",
        harvestDate: cropData.harvestDate,
        status: "Processing",
        earnings: "Processing",
        farmLocation: "Farm Valley, CA",
        price: `$${(Number.parseInt(cropData.weight) * 5).toLocaleString()}`,
        quality: "Grade A",
        iotData: {
          soilMoisture: Math.floor(Math.random() * 20) + 60,
          humidity: Math.floor(Math.random() * 10) + 65,
          temperature: Math.floor(Math.random() * 8) + 20,
          lastUpdate: new Date().toLocaleString(),
          gpsCoordinates: "34.0522,-118.2437",
        },
      })

      setTimeout(() => {
        sharedDataStore.updateBatch(
          newBatch.id,
          { status: "Pending Verification" },
          "System",
          "Batch ready for distributor verification",
        )
      }, 2000)

      setIsUploading(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
      setCropData({ type: "", weight: "", harvestDate: "" })
    }
  }

  const getCropEmoji = (crop: string) => {
    const emojis: { [key: string]: string } = {
      tomatoes: "🍅",
      carrots: "🥕",
      lettuce: "🥬",
      potatoes: "🥔",
      onions: "🧅",
    }
    return emojis[crop] || "🌱"
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadQR = (batch: any) => {
    const link = document.createElement("a")
    link.download = `${batch.lotNumber}-qr-code.svg`
    link.href = batch.qrCode || ""
    link.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing":
        return "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
      case "Pending Verification":
        return "bg-gradient-to-r from-blue-400 to-indigo-400 text-white shadow-lg"
      case "In Transit":
        return "bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg"
      case "Delivered":
        return "bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg"
      case "Ready for Sale":
        return "bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg"
      case "Sold":
        return "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              className="text-lg hover:bg-green-50 transition-colors duration-300 group"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Home
            </Button>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Good Morning, John! 🌱
              </h1>
              <p className="text-green-600 text-sm md:text-base">Let's manage your farm today</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="px-4 py-2 text-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                Farm #001
              </Badge>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Success Message */}
        {showSuccess && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-2xl shadow-lg animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-green-800 font-bold text-xl block">Crop batch uploaded successfully! 🎉</span>
                <span className="text-green-700 text-sm">
                  Your harvest is now in the blockchain and ready for tracking
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm animate-in slide-in-from-right duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" />
                  <span className="text-blue-800 font-medium flex-1">{notification}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            {/* Enhanced Upload Card */}
            <Card className="shadow-xl bg-gradient-to-br from-white to-green-50/50 border-0 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400" />
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl md:text-3xl text-green-700 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  Quick Upload New Crop
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Simple 3-step process to add your harvest to the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Step Indicators */}
                <div className="flex items-center justify-between mb-8">
                  {[
                    { title: "Select Crop", completed: !!cropData.type },
                    { title: "Enter Weight", completed: !!cropData.weight },
                    { title: "Set Date", completed: !!cropData.harvestDate },
                  ].map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          step.completed
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {step.completed ? "✓" : index + 1}
                      </div>
                      <span
                        className={`ml-2 font-medium transition-colors duration-300 ${
                          step.completed ? "text-green-700" : "text-gray-600"
                        }`}
                      >
                        {step.title}
                      </span>
                      {index < 2 && (
                        <div
                          className={`w-16 h-1 ml-4 rounded transition-colors duration-300 ${
                            step.completed ? "bg-green-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      What did you harvest?
                    </Label>
                    <Select value={cropData.type} onValueChange={(value) => setCropData({ ...cropData, type: value })}>
                      <SelectTrigger className="h-16 text-lg border-2 hover:border-green-300 transition-colors duration-300 bg-white">
                        <SelectValue placeholder="Choose your crop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tomatoes" className="text-lg py-3">
                          🍅 Tomatoes
                        </SelectItem>
                        <SelectItem value="carrots" className="text-lg py-3">
                          🥕 Carrots
                        </SelectItem>
                        <SelectItem value="lettuce" className="text-lg py-3">
                          🥬 Lettuce
                        </SelectItem>
                        <SelectItem value="potatoes" className="text-lg py-3">
                          🥔 Potatoes
                        </SelectItem>
                        <SelectItem value="onions" className="text-lg py-3">
                          🧅 Onions
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      How much? (kg)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter weight"
                      className="h-16 text-lg text-center border-2 hover:border-green-300 transition-colors duration-300 bg-white"
                      value={cropData.weight}
                      onChange={(e) => setCropData({ ...cropData, weight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      When harvested?
                    </Label>
                    <Input
                      type="date"
                      className="h-16 text-lg border-2 hover:border-green-300 transition-colors duration-300 bg-white"
                      value={cropData.harvestDate}
                      onChange={(e) => setCropData({ ...cropData, harvestDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleQuickSubmit}
                    size="lg"
                    className="flex-1 h-18 text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={!cropData.type || !cropData.weight || !cropData.harvestDate || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        Uploading to Blockchain...
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mr-3" />
                        Upload Crop Data
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-18 px-8 bg-white border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                  >
                    <Camera className="w-6 h-6 mr-2" />
                    Add Photo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Recent Harvests */}
            <Card className="shadow-xl bg-gradient-to-br from-white to-blue-50/30 border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl text-green-700 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      Your Recent Harvests
                    </CardTitle>
                    <CardDescription className="text-base">Track your crops through the supply chain</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentBatches.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-12 h-12 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No harvests yet</h3>
                      <p className="text-gray-500">Upload your first crop batch to get started!</p>
                    </div>
                  ) : (
                    recentBatches.map((batch, index) => (
                      <div
                        key={batch.id}
                        className="p-6 bg-gradient-to-br from-white via-green-50/50 to-cyan-50/50 rounded-2xl border-2 border-green-100 hover:border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                          <div className="flex items-center gap-4 mb-4 lg:mb-0">
                            <div className="text-5xl bg-white rounded-2xl p-3 shadow-md">
                              {batch.crop.split(" ")[0]}
                            </div>
                            <div>
                              <h4 className="text-xl md:text-2xl font-bold text-gray-800">
                                {batch.crop.split(" ")[1]}
                              </h4>
                              <p className="text-green-600 font-bold text-lg">{batch.weight}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Lot: {batch.lotNumber}
                                </p>
                                <p className="text-sm text-gray-500">• ID: {batch.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-2xl md:text-3xl font-bold text-green-700 mb-2">{batch.earnings}</p>
                            <Badge className={`text-sm px-3 py-1 ${getStatusColor(batch.status)}`}>
                              {batch.status === "In Transit" && <Truck className="w-3 h-3 mr-1" />}
                              {batch.status === "Ready for Sale" && <Package className="w-3 h-3 mr-1" />}
                              {batch.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Enhanced Progress Bar */}
                        <div className="mb-6">
                          <div className="flex justify-between text-xs text-gray-600 mb-3 font-medium">
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
                          <div className="relative">
                            <Progress value={getProgressValue(batch.status)} className="h-3 bg-gray-200" />
                            <div
                              className="absolute top-0 h-3 bg-gradient-to-r from-green-500 via-blue-500 via-purple-500 to-orange-500 rounded-full transition-all duration-1000"
                              style={{ width: `${getProgressValue(batch.status)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 transition-all duration-300"
                                onClick={() => setSelectedBatch(batch)}
                              >
                                <QrCode className="w-4 h-4 mr-2" />
                                View QR & Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-xl">
                                  Batch Details - {selectedBatch?.lotNumber}
                                </DialogTitle>
                                <DialogDescription>Complete traceability information</DialogDescription>
                              </DialogHeader>
                              {selectedBatch && (
                                <div className="space-y-6">
                                  <div className="text-center bg-gray-50 p-6 rounded-xl">
                                    <img
                                      src={selectedBatch.qrCode || "/placeholder.svg"}
                                      alt={`QR Code for ${selectedBatch.lotNumber}`}
                                      className="mx-auto border-2 border-gray-200 rounded-xl shadow-lg"
                                      width={200}
                                      height={200}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                      <p className="font-bold mb-3 text-green-700 flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Batch Information
                                      </p>
                                      <div className="space-y-2 text-sm">
                                        <p>
                                          <span className="font-medium">Crop:</span> {selectedBatch.crop}
                                        </p>
                                        <p>
                                          <span className="font-medium">Weight:</span> {selectedBatch.weight}
                                        </p>
                                        <p>
                                          <span className="font-medium">Harvest:</span> {selectedBatch.harvestDate}
                                        </p>
                                        <p>
                                          <span className="font-medium">Quality:</span> {selectedBatch.quality}
                                        </p>
                                        <p>
                                          <span className="font-medium">Location:</span> {selectedBatch.farmLocation}
                                        </p>
                                        <p>
                                          <span className="font-medium">Status:</span>
                                          <Badge className={`ml-2 text-xs ${getStatusColor(selectedBatch.status)}`}>
                                            {selectedBatch.status}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                      <p className="font-bold mb-3 text-blue-700 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Blockchain & Tracking
                                      </p>
                                      <div className="space-y-2 text-sm">
                                        <p>
                                          <span className="font-medium">Blockchain TX:</span>{" "}
                                          {selectedBatch.blockchain?.slice(0, 20)}...
                                        </p>
                                        <p>
                                          <span className="font-medium">Created:</span>{" "}
                                          {new Date(selectedBatch.createdAt).toLocaleString()}
                                        </p>
                                        <p>
                                          <span className="font-medium">Last Updated:</span>{" "}
                                          {new Date(selectedBatch.updatedAt).toLocaleString()}
                                        </p>
                                        <p>
                                          <span className="font-medium">Tracking Events:</span>{" "}
                                          {selectedBatch.trackingHistory.length}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* IoT Data Section */}
                                  {selectedBatch.iotData && (
                                    <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                                      <p className="font-bold mb-3 text-cyan-700 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4" />
                                        IoT Sensor Data
                                      </p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                          <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                                          <p className="font-medium">Soil Moisture</p>
                                          <p className="text-xl font-bold text-blue-600">
                                            {selectedBatch.iotData.soilMoisture}%
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <Thermometer className="w-6 h-6 text-red-500 mx-auto mb-1" />
                                          <p className="font-medium">Temperature</p>
                                          <p className="text-xl font-bold text-red-600">
                                            {selectedBatch.iotData.temperature}°C
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                                          <p className="font-medium">Humidity</p>
                                          <p className="text-xl font-bold text-yellow-600">
                                            {selectedBatch.iotData.humidity}%
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <MapPin className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                                          <p className="font-medium">GPS</p>
                                          <p className="text-sm font-bold text-purple-600 break-all">
                                            {selectedBatch.iotData.gpsCoordinates}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Tracking History Section */}
                                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="font-bold mb-3 text-gray-700 flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Tracking History
                                    </p>
                                    <ul className="space-y-3 text-sm">
                                      {selectedBatch.trackingHistory.map((event: any, i: number) => (
                                        <li key={i} className="flex items-start gap-3">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                          <div>
                                            <p className="font-semibold text-gray-800">{event.status}</p>
                                            <p className="text-gray-600">{event.note}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                              {new Date(event.timestamp).toLocaleString()}
                                            </p>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                    <Button size="sm" onClick={() => downloadQR(selectedBatch)} className="flex-1">
                                      <Download className="w-4 h-4 mr-2" /> Download QR Code
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(selectedBatch.blockchain)}
                                      className="flex-1"
                                    >
                                      <Copy className="w-4 h-4 mr-2" /> Copy Blockchain ID
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 transition-all duration-300"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Analytics
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1 space-y-6">
            {/* Stats Card 1 */}
            <Card className="shadow-xl bg-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Crops Uploaded</CardTitle>
                <Leaf className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{recentBatches.length} Batches</div>
                <p className="text-xs text-gray-500">+20% from last month</p>
              </CardContent>
            </Card>

            {/* Stats Card 2 */}
            <Card className="shadow-xl bg-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Weight</CardTitle>
                <Package className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {recentBatches.reduce((sum, batch) => sum + Number(batch.weight.replace("kg", "")), 0)} kg
                </div>
                <p className="text-xs text-gray-500">Ready for distributors</p>
              </CardContent>
            </Card>

            {/* Stats Card 3 */}
            <Card className="shadow-xl bg-white border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Est. Earnings</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${recentBatches.reduce((sum, batch) => sum + Number(batch.price.replace(/[$,]/g, "")), 0)}
                </div>
                <p className="text-xs text-gray-500">Based on estimated retail price</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
