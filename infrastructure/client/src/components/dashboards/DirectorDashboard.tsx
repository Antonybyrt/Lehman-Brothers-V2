"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageSquare
} from "lucide-react"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { useTranslations } from 'next-intl'
import { savingsBookService, SavingsRate, SavingsBookType } from "@/services/savingsBookService"

export default function DirectorDashboard() {
  const t = useTranslations('dashboard.director')
  const tCommon = useTranslations('common')
  const [activeTab, setActiveTab] = useState('overview')
  const [rates, setRates] = useState<SavingsRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [newRate, setNewRate] = useState<string>('')
  const [selectedBookType, setSelectedBookType] = useState<SavingsBookType>('LIVRET_A')
  const [message, setMessage] = useState('')
  const [updatingRate, setUpdatingRate] = useState(false)

  const currentRate = rates.find(r => r.bookType === selectedBookType)?.ratePercent || '0'
  const currentRateValue = rates.find(r => r.bookType === selectedBookType)?.rate || 0

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      setLoadingRates(true)
      const token = localStorage.getItem('auth_token')
      if (token) {
        savingsBookService.setAuthToken(token)
      }
      const response = await savingsBookService.getCurrentRates()
      if (response.success && response.rates) {
        setRates(response.rates)
        // Set default new rate to current rate * 100 (percentage)
        const livretARate = response.rates.find(r => r.bookType === 'LIVRET_A')
        if (livretARate) {
          setNewRate((livretARate.rate * 100).toString())
        }
      }
    } catch (error) {
      console.error('Failed to load rates', error)
    } finally {
      setLoadingRates(false)
    }
  }

  const handleUpdateRate = async () => {
    try {
      setUpdatingRate(true)
      const rateValue = parseFloat(newRate)
      // Convert percentage to decimal (e.g. 2.5% -> 0.025)
      const decimalRate = rateValue / 100

      const response = await savingsBookService.updateRate({
        bookType: selectedBookType,
        rate: decimalRate
      })

      if (response.success) {
        await loadRates()
        alert('Rate updated successfully')
      } else {
        alert(response.error || 'Failed to update rate')
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    } finally {
      setUpdatingRate(false)
    }
  }

  // Mock data for director dashboard
  const mockData = {
    bankStats: {
      totalClients: 1247,
      totalAccounts: 3891,
      totalLoans: 156,
      totalDeposits: 45600000,
      monthlyRevenue: 890000,
      savingsRate: 2.5
    },
    accounts: [
      { id: '1', client: 'Jean Dupont', iban: 'FR76 3000 1007 9412 3456 7890 123', balance: 15420.50, status: 'active', type: 'current' },
      { id: '2', client: 'Marie Martin', iban: 'FR76 3000 1007 9412 3456 7890 124', balance: 8500.00, status: 'active', type: 'savings' },
      { id: '3', client: 'Pierre Durand', iban: 'FR76 3000 1007 9412 3456 7890 125', balance: 3200.75, status: 'banned', type: 'current' },
      { id: '4', client: 'Sophie Leroy', iban: 'FR76 3000 1007 9412 3456 7890 126', balance: 12500.00, status: 'active', type: 'current' }
    ],
    stocks: [
      { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, change: '+2.5%', status: 'active', marketCap: '2.8T' },
      { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', price: 245.30, change: '-1.2%', status: 'active', marketCap: '780B' },
      { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.25, change: '+0.8%', status: 'active', marketCap: '2.9T' },
      { id: '4', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: '+1.5%', status: 'inactive', marketCap: '1.8T' }
    ],
    notifications: [
      { id: '1', type: 'rate_change', message: 'Savings rate changed to 2.5%', date: '2024-01-15', status: 'sent' },
      { id: '2', type: 'stock_added', message: 'New stock added: NVIDIA Corp.', date: '2024-01-14', status: 'sent' },
      { id: '3', type: 'account_banned', message: 'Pierre Durand account suspended', date: '2024-01-13', status: 'pending' }
    ]
  }

  const tabs = [
    { id: 'overview', label: t('tabs.overview'), icon: BarChart3 },
    { id: 'accounts', label: t('tabs.accounts'), icon: Users },
    { id: 'chats', label: t('tabs.management'), icon: MessageSquare },
    { id: 'stocks', label: t('management.stocks'), icon: TrendingUp },
    { id: 'rates', label: t('management.savingsRate'), icon: DollarSign },
    { id: 'notifications', label: t('tabs.notifications'), icon: Activity }
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
            {t('title')}
          </h1>
          <p className="text-muted-foreground/80 text-lg">
            {t('welcome')}
          </p>
        </motion.div>

        {/* Bank Stats */}
        <motion.div
          className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.activeClients')}</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.bankStats.totalClients.toLocaleString('fr-FR')}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('tabs.accounts')}</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.bankStats.totalAccounts.toLocaleString('fr-FR')}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('management.stocks')}</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.bankStats.totalLoans}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalAssets')}</p>
                  <p className="text-2xl font-bold text-foreground">{(mockData.bankStats.totalDeposits / 1000000).toFixed(1)}M €</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalRevenue')}</p>
                  <p className="text-2xl font-bold text-foreground">{(mockData.bankStats.monthlyRevenue / 1000).toFixed(0)}K €</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('management.savingsRate')}</p>
                  <p className="text-2xl font-bold text-foreground">{(currentRateValue * 100).toFixed(2)}%</p>
                </div>
                <Settings className="h-8 w-8 text-cyan-500" />
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${activeTab === tab.id
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
              {/* Recent Notifications */}
              <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>{t('notifications.title')}</span>
                  </CardTitle>
                  <CardDescription>{t('title')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockData.notifications.map((notification) => (
                    <div key={notification.id} className="p-3 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {notification.type === 'rate_change' && <Settings className="h-4 w-4 text-blue-500" />}
                          {notification.type === 'stock_added' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {notification.type === 'account_banned' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          <p className="font-medium text-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{notification.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${notification.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {notification.status === 'sent' ? 'Sent' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Account Status Overview */}
              <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{t('accounts.title')}</span>
                  </CardTitle>
                  <CardDescription>{t('title')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-foreground">{t('accounts.active')}</span>
                      </div>
                      <span className="font-bold text-green-600">3,891</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-foreground">{t('accounts.suspended')}</span>
                      </div>
                      <span className="font-bold text-red-600">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium text-foreground">{t('notifications.noNotifications')}</span>
                      </div>
                      <span className="font-bold text-yellow-600">8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'accounts' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{t('accounts.title')}</span>
                  </span>
                  <Button className="bg-primary/90 hover:bg-primary/80">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('accounts.noAccounts')}
                  </Button>
                </CardTitle>
                <CardDescription>{t('title')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{account.client}</p>
                            <p className="text-sm text-muted-foreground">{account.iban}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.type === 'savings' ? 'Savings account' : 'Current account'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-xl font-bold text-foreground">{account.balance.toLocaleString('fr-FR')} €</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {account.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          {account.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'stocks' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Stock Management</span>
                  </span>
                  <Button className="bg-primary/90 hover:bg-primary/80">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stock
                  </Button>
                </CardTitle>
                <CardDescription>Manage stocks available for clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.stocks.map((stock) => (
                    <div key={stock.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{stock.symbol} - {stock.name}</p>
                            <p className="text-sm text-muted-foreground">Market cap: {stock.marketCap}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-xl font-bold text-foreground">{stock.price} $</p>
                        <p className={`text-sm ${stock.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${stock.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {stock.status === 'active' ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          {stock.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'rates' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Savings Rate Management</span>
                </CardTitle>
                <CardDescription>Modify the savings rate for all accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-background/60 rounded-lg border border-border/30">
                      <h3 className="font-semibold text-foreground mb-3">Current Rate</h3>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-primary">{(currentRateValue * 100).toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Applied annual rate</p>
                        <div className="mt-2 flex justify-center space-x-2">
                          {(['LIVRET_A', 'LDD'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => setSelectedBookType(type)}
                              className={`px-3 py-1 rounded text-xs ${selectedBookType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                            >
                              {type.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-background/60 rounded-lg border border-border/30">
                      <h3 className="font-semibold text-foreground mb-3">Financial Impact</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Savings accounts</span>
                          <span className="font-semibold">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total amount</span>
                          <span className="font-semibold">N/A</span>
                        </div>
                        <div className="flex justify-between border-t border-border/30 pt-2">
                          <span className="text-sm font-medium text-foreground">Annual interest</span>
                          <span className="font-bold text-primary">N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">New Savings Rate (%) for {selectedBookType.replace('_', ' ')}</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="2.5"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Application Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Message to Clients</label>
                      <textarea
                        placeholder="Inform your clients about the rate change..."
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <Button
                      onClick={handleUpdateRate}
                      disabled={updatingRate}
                      className="w-full bg-primary/90 hover:bg-primary/80"
                    >
                      {updatingRate ? 'Updating...' : 'Modify Savings Rate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'chats' && (
            <ChatContainer />
          )}

          {activeTab === 'notifications' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Notification Center</span>
                </CardTitle>
                <CardDescription>Manage notifications sent to clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.notifications.map((notification) => (
                    <div key={notification.id} className="p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {notification.type === 'rate_change' && <Settings className="h-5 w-5 text-blue-500" />}
                          {notification.type === 'stock_added' && <TrendingUp className="h-5 w-5 text-green-500" />}
                          {notification.type === 'account_banned' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                          <div>
                            <p className="font-semibold text-foreground">{notification.message}</p>
                            <p className="text-sm text-muted-foreground">Sent on {notification.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${notification.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {notification.status === 'sent' ? 'Sent' : 'Pending'}
                          </span>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {notification.type === 'rate_change' && 'Notification sent to all clients with savings accounts'}
                        {notification.type === 'stock_added' && 'Notification sent to all investor clients'}
                        {notification.type === 'account_banned' && 'Notification sent to the concerned client'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
