export interface BatchData {
  id: string
  lotNumber: string
  crop: string
  weight: string
  farmer: string
  harvestDate: string
  status: "Processing" | "Pending Verification" | "In Transit" | "Delivered" | "Ready for Sale" | "Sold"
  earnings: string
  farmLocation: string
  price: string
  quality: string
  blockchain: string
  qrCode?: string
  createdAt: string
  updatedAt: string
  trackingHistory: TrackingEvent[]
  iotData?: {
    soilMoisture: number
    humidity: number
    temperature: number
    lastUpdate: string
    gpsCoordinates: string
  }
}

export interface TrackingEvent {
  timestamp: string
  status: string
  note: string
  updatedBy: string
  location?: string
}

class SupplyChainStore {
  private batches: BatchData[] = []
  private subscribers: (() => void)[] = []
  private eventListeners: ((event: string, data: any) => void)[] = []

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData()
  }

  private initializeSampleData() {
    const sampleBatches: BatchData[] = [
      {
        id: "batch-001",
        lotNumber: "LOT-2024-001",
        crop: "🍅 Tomatoes",
        weight: "150kg",
        farmer: "John Smith",
        harvestDate: "2024-01-15",
        status: "In Transit",
        earnings: "$750",
        farmLocation: "Farm Valley, CA",
        price: "$750",
        quality: "Grade A",
        blockchain: "0x1234567890abcdef1234567890abcdef12345678",
        qrCode: "/qr-code-for-tomato-batch-lot-2024-001.jpg",
        createdAt: "2024-01-15T08:00:00Z",
        updatedAt: "2024-01-16T14:30:00Z",
        trackingHistory: [
          {
            timestamp: "2024-01-15T08:00:00Z",
            status: "Processing",
            note: "Batch created and uploaded to blockchain",
            updatedBy: "John Smith (Farmer)",
          },
          {
            timestamp: "2024-01-15T12:00:00Z",
            status: "Pending Verification",
            note: "Quality inspection completed",
            updatedBy: "System",
          },
          {
            timestamp: "2024-01-16T09:00:00Z",
            status: "In Transit",
            note: "Picked up by distributor truck #D-101",
            updatedBy: "Green Valley Distributors",
          },
        ],
        iotData: {
          soilMoisture: 75,
          humidity: 68,
          temperature: 22,
          lastUpdate: "2024-01-16T14:30:00Z",
          gpsCoordinates: "34.0522,-118.2437",
        },
      },
      {
        id: "batch-002",
        lotNumber: "LOT-2024-002",
        crop: "🥕 Carrots",
        weight: "200kg",
        farmer: "Sarah Johnson",
        harvestDate: "2024-01-14",
        status: "Ready for Sale",
        earnings: "$800",
        farmLocation: "Sunny Acres Farm, OR",
        price: "$800",
        quality: "Grade A+",
        blockchain: "0xabcdef1234567890abcdef1234567890abcdef12",
        qrCode: "/qr-code-for-carrot-batch-lot-2024-002.jpg",
        createdAt: "2024-01-14T07:30:00Z",
        updatedAt: "2024-01-17T10:15:00Z",
        trackingHistory: [
          {
            timestamp: "2024-01-14T07:30:00Z",
            status: "Processing",
            note: "Harvest completed and batch registered",
            updatedBy: "Sarah Johnson (Farmer)",
          },
          {
            timestamp: "2024-01-15T14:00:00Z",
            status: "In Transit",
            note: "Shipped to Fresh Market Co.",
            updatedBy: "Valley Logistics",
          },
          {
            timestamp: "2024-01-16T16:30:00Z",
            status: "Delivered",
            note: "Received at Fresh Market warehouse",
            updatedBy: "Fresh Market Co.",
          },
          {
            timestamp: "2024-01-17T10:15:00Z",
            status: "Ready for Sale",
            note: "Quality approved, now available for consumers",
            updatedBy: "Fresh Market Co.",
          },
        ],
        iotData: {
          soilMoisture: 82,
          humidity: 71,
          temperature: 18,
          lastUpdate: "2024-01-17T10:15:00Z",
          gpsCoordinates: "45.5152,-122.6784",
        },
      },
    ]

    this.batches = sampleBatches
  }

  addBatch(batchData: Partial<BatchData>): BatchData {
    const newBatch: BatchData = {
      id: `batch-${Date.now()}`,
      lotNumber: `LOT-${new Date().getFullYear()}-${String(this.batches.length + 1).padStart(3, "0")}`,
      blockchain: `0x${Math.random().toString(16).substr(2, 40)}`,
      qrCode: `/placeholder.svg?height=200&width=200&query=QR code for ${batchData.crop} batch`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingHistory: [
        {
          timestamp: new Date().toISOString(),
          status: batchData.status || "Processing",
          note: "Batch created and uploaded to blockchain",
          updatedBy: batchData.farmer || "Unknown Farmer",
        },
      ],
      ...batchData,
    } as BatchData

    this.batches.unshift(newBatch)
    this.notifySubscribers()
    this.notifyEventListeners("batchAdded", newBatch)
    return newBatch
  }

  updateBatch(id: string, updates: Partial<BatchData>, updatedBy: string, note: string): BatchData | null {
    const batchIndex = this.batches.findIndex((batch) => batch.id === id)
    if (batchIndex === -1) return null

    const batch = this.batches[batchIndex]
    const updatedBatch = {
      ...batch,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // Add tracking event if status changed
    if (updates.status && updates.status !== batch.status) {
      updatedBatch.trackingHistory = [
        ...batch.trackingHistory,
        {
          timestamp: new Date().toISOString(),
          status: updates.status,
          note,
          updatedBy,
        },
      ]
    }

    this.batches[batchIndex] = updatedBatch
    this.notifySubscribers()
    this.notifyEventListeners("batchUpdated", { id, updates })
    return updatedBatch
  }

  getBatch(id: string): BatchData | null {
    return this.batches.find((batch) => batch.id === id) || null
  }

  getBatchByLotNumber(lotNumber: string): BatchData | null {
    return this.batches.find((batch) => batch.lotNumber === lotNumber) || null
  }

  getAllBatches(): BatchData[] {
    return [...this.batches]
  }

  getBatchesByStatus(status: BatchData["status"]): BatchData[] {
    return this.batches.filter((batch) => batch.status === status)
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
    }
  }

  onEvent(callback: (event: string, data: any) => void): () => void {
    this.eventListeners.push(callback)
    return () => {
      this.eventListeners = this.eventListeners.filter((listener) => listener !== callback)
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback())
  }

  private notifyEventListeners(event: string, data: any) {
    this.eventListeners.forEach((callback) => callback(event, data))
  }

  // Simulate blockchain operations
  simulateDistributorUpdate(batchId: string) {
    setTimeout(() => {
      this.updateBatch(batchId, { status: "Delivered" }, "Green Valley Distributors", "Delivered to retail partner")
    }, 3000)
  }

  simulateRetailerUpdate(batchId: string) {
    setTimeout(() => {
      this.updateBatch(
        batchId,
        { status: "Ready for Sale" },
        "Fresh Market Co.",
        "Quality approved, ready for consumers",
      )
    }, 5000)
  }
}

export const sharedDataStore = new SupplyChainStore()
