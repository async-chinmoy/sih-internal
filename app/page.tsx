"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Leaf,
  Shield,
  Eye,
  Truck,
  Store,
  Users,
  QrCode,
  ArrowRight,
  Scan,
  Search,
  BarChart3,
  Globe,
  Zap,
  Star,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"qr" | "lot">("lot")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to tracking page with query
      window.location.href = `/track?${searchType}=${encodeURIComponent(searchQuery)}`
    }
  }

  const stakeholders = [
    {
      title: "Farmers",
      icon: Leaf,
      description: "Upload crop data, track earnings, and prove authenticity with blockchain verification",
      color: "bg-green-500",
      link: "/farmer",
      stats: "10K+ Active",
    },
    {
      title: "Distributors",
      icon: Truck,
      description: "Verify quality, manage logistics, and update transport status in real-time",
      color: "bg-blue-500",
      link: "/distributor",
      stats: "500+ Partners",
    },
    {
      title: "Retailers",
      icon: Store,
      description: "Confirm deliveries, manage inventory, and ensure compliance with transparency",
      color: "bg-accent",
      link: "/retailer",
      stats: "2K+ Stores",
    },
    {
      title: "Consumers",
      icon: Users,
      description: "Scan QR codes, verify authenticity, and see complete price transparency",
      color: "bg-orange-500",
      link: "/consumer",
      stats: "50K+ Users",
    },
  ]

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description:
        "Immutable records on Ethereum/Polygon ensure data integrity and prevent fraud across the entire supply chain",
    },
    {
      icon: Eye,
      title: "Complete Transparency",
      description: "Track every step from farm to fork with real-time status updates and comprehensive audit trails",
    },
    {
      icon: QrCode,
      title: "QR Code Traceability",
      description:
        "Instant access to batch history, quality data, and pricing information with simple smartphone scanning",
    },
    {
      icon: BarChart3,
      title: "IoT Integration",
      description: "GPS and sensor data logged during transport for enhanced verification and quality monitoring",
    },
    {
      icon: Globe,
      title: "Global Standards",
      description: "Certified by government and accredited bodies for quality assurance and international compliance",
    },
    {
      icon: Zap,
      title: "Smart Contracts",
      description: "Automated escrow payments ensure fair compensation for all parties with transparent pricing",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Farmers Connected", icon: Leaf },
    { number: "500+", label: "Distribution Partners", icon: Truck },
    { number: "2,000+", label: "Retail Locations", icon: Store },
    { number: "50,000+", label: "Products Tracked", icon: QrCode },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center animate-pulse-glow">
                <Leaf className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">SurgeX</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Blockchain Agriculture</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-foreground hover:text-accent transition-colors font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-foreground hover:text-accent transition-colors font-medium">
                How It Works
              </Link>
              <Link href="#stakeholders" className="text-foreground hover:text-accent transition-colors font-medium">
                Stakeholders
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-accent hover:text-accent-foreground transition-all duration-300 bg-transparent"
              >
                Sign In
              </Button>
            </nav>
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`py-16 sm:py-20 lg:py-24 hero-gradient ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 text-sm font-semibold px-4 py-2 hover:bg-accent/30 transition-colors">
              <Star className="w-4 h-4 mr-2" />
              Powered by Blockchain Technology
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
              Revolutionizing Agriculture Through
              <span className="gradient-text block mt-2"> Blockchain Innovation</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto leading-relaxed">
              Complete supply chain transparency from farm to fork. Track your food's journey, verify authenticity, and
              ensure fair pricing for everyone in the agricultural ecosystem.
            </p>

            {/* Enhanced Search Interface */}
            <Card className="max-w-3xl mx-auto mb-8 shadow-2xl border-2 hover:border-accent/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3 justify-center">
                  <Search className="w-6 h-6 text-accent" />
                  Track Any Batch Instantly
                </CardTitle>
                <CardDescription className="text-base">
                  Enter a lot number or scan a QR code to see complete blockchain-verified traceability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant={searchType === "lot" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchType("lot")}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      Lot ID
                    </Button>
                    <Button
                      variant={searchType === "qr" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchType("qr")}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Scan
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder={
                        searchType === "lot" ? "Enter lot number (e.g., LOT-2024-001)" : "Scan QR code or enter data"
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 text-base py-3 border-2 focus:border-accent"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery.trim()}
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-6"
                    >
                      {searchType === "qr" ? <Scan className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-2 hover:border-accent hover:text-accent transition-all duration-300 bg-transparent"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-accent" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-sm sm:text-base opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="stakeholders" className="py-16 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Built for Every Stakeholder
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From farmers to consumers, everyone gets real-time access to batch details and supply chain updates
              through our comprehensive blockchain platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stakeholders.map((stakeholder, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer border-2 hover:border-accent/50"
              >
                <Link href={stakeholder.link}>
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-16 h-16 ${stakeholder.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <stakeholder.icon className="w-8 h-8 text-white" />
                    </div>
                    <Badge variant="outline" className="mb-2 text-accent border-accent">
                      {stakeholder.stats}
                    </Badge>
                    <CardTitle className="text-xl font-bold">{stakeholder.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-center leading-relaxed">{stakeholder.description}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced technology ensuring transparency, security, and efficiency across the entire agricultural supply
              chain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 shadow-lg hover:shadow-2xl hover:border-accent/50 transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-accent" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Simple steps to complete supply chain transparency
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  step: "1",
                  title: "Farm Upload",
                  description: "Farmers upload crop data with IoT sensor information to the blockchain",
                  icon: Leaf,
                  color: "bg-green-500",
                },
                {
                  step: "2",
                  title: "Distribution",
                  description: "Distributors verify quality and update transport status in real-time",
                  icon: Truck,
                  color: "bg-blue-500",
                },
                {
                  step: "3",
                  title: "Retail Ready",
                  description: "Retailers confirm delivery and make products available for sale",
                  icon: Store,
                  color: "bg-purple-500",
                },
                {
                  step: "4",
                  title: "Consumer Access",
                  description: "Consumers scan QR codes to see complete farm-to-fork journey",
                  icon: QrCode,
                  color: "bg-orange-500",
                },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}
                  >
                    <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      Step {step.step}
                    </Badge>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm px-2">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <TrendingUp className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Supply Chain?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              Join thousands of farmers, distributors, and retailers already using SurgeX for complete supply chain
              transparency and blockchain-verified authenticity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent text-lg px-8 py-4 transition-all duration-300"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">SurgeX</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Blockchain-powered agricultural supply chain transparency for a better future.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/farmer" className="hover:text-foreground transition-colors">
                    Farmers
                  </Link>
                </li>
                <li>
                  <Link href="/distributor" className="hover:text-foreground transition-colors">
                    Distributors
                  </Link>
                </li>
                <li>
                  <Link href="/retailer" className="hover:text-foreground transition-colors">
                    Retailers
                  </Link>
                </li>
                <li>
                  <Link href="/consumer" className="hover:text-foreground transition-colors">
                    Consumers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/docs" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-foreground transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-foreground transition-colors">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            <p>
              &copy; 2024 SurgeX. All rights reserved. Built with blockchain technology for agricultural
              transparency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
