"use client"

import { useState } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  MessageCircle, 
  CreditCard, 
  Users, 
  Calculator,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3
} from "lucide-react"

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data for advisor dashboard
  const mockData = {
    pendingMessages: [
      { id: '1', client: 'Jean Dupont', message: 'Hello, I would like to get a mortgage loan...', time: '2 min', priority: 'high' },
      { id: '2', client: 'Marie Martin', message: 'Question about my savings account', time: '15 min', priority: 'medium' },
      { id: '3', client: 'Pierre Durand', message: 'Need help with my investments', time: '1h', priority: 'low' }
    ],
    activeLoans: [
      { id: '1', client: 'Jean Dupont', amount: 250000, remaining: 180000, monthlyPayment: 1200, rate: 2.1, status: 'active' },
      { id: '2', client: 'Sophie Leroy', amount: 80000, remaining: 45000, monthlyPayment: 450, rate: 1.8, status: 'active' },
      { id: '3', client: 'Marc Petit', amount: 150000, remaining: 0, monthlyPayment: 0, rate: 2.3, status: 'completed' }
    ],
    clients: [
      { id: '1', name: 'Jean Dupont', email: 'jean.dupont@email.com', accounts: 3, lastActivity: 'Today', status: 'active' },
      { id: '2', name: 'Marie Martin', email: 'marie.martin@email.com', accounts: 2, lastActivity: 'Yesterday', status: 'active' },
      { id: '3', name: 'Pierre Durand', email: 'pierre.durand@email.com', accounts: 4, lastActivity: '3 days ago', status: 'inactive' }
    ],
    stats: {
      totalClients: 45,
      activeLoans: 12,
      pendingMessages: 8,
      monthlyRevenue: 15600
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'calculator', label: 'Calculator', icon: Calculator }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/5 via-background/3 to-background/8 relative overflow-hidden">
      {/* Background Spline */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/8" />
      </div>

      <Header />

      <div className="container mx-auto px-4 pt-20 pb-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-prestige font-bold text-foreground/90 mb-2">
            Banking Advisor Space
          </h1>
          <p className="text-muted-foreground/80 text-lg">
            Support your clients in their financial projects
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.stats.totalClients}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.stats.pendingMessages}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.stats.activeLoans}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.stats.monthlyRevenue.toLocaleString('fr-FR')} €</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex space-x-1 bg-background/60 backdrop-blur-xl rounded-lg p-1 border border-border/50">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending Messages */}
              <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Pending Messages</span>
                  </CardTitle>
                  <CardDescription>Client messages requiring a response</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockData.pendingMessages.map((message) => (
                    <div key={message.id} className="p-3 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-foreground">{message.client}</p>
                          {message.priority === 'high' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {message.priority === 'medium' && <Clock className="h-4 w-4 text-yellow-500" />}
                          {message.priority === 'low' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{message.message}</p>
                      <Button size="sm" className="bg-primary/90 hover:bg-primary/80">
                        Reply
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Active Loans */}
              <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Active Loans</span>
                  </CardTitle>
                  <CardDescription>Tracking of ongoing loans</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockData.activeLoans.map((loan) => (
                    <div key={loan.id} className="p-3 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">{loan.client}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          loan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {loan.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Initial amount</p>
                          <p className="font-semibold">{loan.amount.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining balance</p>
                          <p className="font-semibold">{loan.remaining.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly payment</p>
                          <p className="font-semibold">{loan.monthlyPayment.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rate</p>
                          <p className="font-semibold">{loan.rate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'messages' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Instant Messaging</span>
                </CardTitle>
                <CardDescription>Communicate with your clients in real time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.pendingMessages.map((message) => (
                    <div key={message.id} className="p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{message.client}</p>
                            <p className="text-sm text-muted-foreground">{message.time}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Transfer
                          </Button>
                          <Button size="sm" className="bg-primary/90 hover:bg-primary/80">
                            Reply
                          </Button>
                        </div>
                      </div>
                      <div className="bg-background/40 p-3 rounded-lg mb-3">
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type your response..."
                          className="flex-1 px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Button size="sm" className="bg-primary/90 hover:bg-primary/80">
                          Send
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'loans' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Loan Management</span>
                  </span>
                  <Button className="bg-primary/90 hover:bg-primary/80">
                    New Loan
                  </Button>
                </CardTitle>
                <CardDescription>Grant and manage client loans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.activeLoans.map((loan) => (
                    <div key={loan.id} className="p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{loan.client}</p>
                            <p className="text-sm text-muted-foreground">Mortgage loan</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">{loan.amount.toLocaleString('fr-FR')} €</p>
                          <p className="text-sm text-muted-foreground">Rate: {loan.rate}%</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-background/40 rounded-lg">
                          <p className="text-sm text-muted-foreground">Remaining balance</p>
                          <p className="font-semibold text-foreground">{loan.remaining.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div className="text-center p-3 bg-background/40 rounded-lg">
                          <p className="text-sm text-muted-foreground">Monthly payment</p>
                          <p className="font-semibold text-foreground">{loan.monthlyPayment.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div className="text-center p-3 bg-background/40 rounded-lg">
                          <p className="text-sm text-muted-foreground">Progress</p>
                          <p className="font-semibold text-green-600">{Math.round((1 - loan.remaining / loan.amount) * 100)}%</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Client Portfolio</span>
                </CardTitle>
                <CardDescription>Manage your client portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          <p className="text-xs text-muted-foreground">{client.accounts} accounts • Last activity: {client.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <Button variant="outline" size="sm">
                          Contact
                        </Button>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'calculator' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Loan Calculator</span>
                </CardTitle>
                <CardDescription>Calculate monthly payments and loan conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Loan amount</label>
                      <input
                        type="number"
                        placeholder="250000"
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Duration (years)</label>
                      <input
                        type="number"
                        placeholder="20"
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Interest rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2.1"
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Insurance rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.36"
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <Button className="w-full bg-primary/90 hover:bg-primary/80">
                      Calculate
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-background/60 rounded-lg border border-border/30">
                      <h3 className="font-semibold text-foreground mb-3">Calculation Results</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Mensualité hors assurance</span>
                          <span className="font-semibold">1,200 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Assurance mensuelle</span>
                          <span className="font-semibold">75 €</span>
                        </div>
                        <div className="flex justify-between border-t border-border/30 pt-2">
                          <span className="text-sm font-medium text-foreground">Mensualité totale</span>
                          <span className="font-bold text-primary">1,275 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Coût total du crédit</span>
                          <span className="font-semibold">306,000 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Coût des intérêts</span>
                          <span className="font-semibold">56,000 €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
