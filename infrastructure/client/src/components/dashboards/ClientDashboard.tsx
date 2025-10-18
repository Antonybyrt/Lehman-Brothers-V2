"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  CreditCard,
  TrendingUp,
  PiggyBank,
  ArrowUpDown,
  Plus,
  Settings,
  DollarSign,
  Activity,
  BarChart3,
  Loader2,
  Wallet,
  MessageSquare
} from "lucide-react"
import { accountService, Account } from "@/services/accountService"
import { CreateAccountDialog, EditAccountDialog, DeleteAccountDialog } from "@/components/dialogs"
import { DashboardChat } from "@/components/dashboards/DashboardChat"

export default function ClientDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  // Mock data for other sections (transactions, investments)
  const mockData = {
    recentTransactions: [
      { id: '1', from: 'Main Account', to: 'Savings Account', amount: 500, date: '2024-01-15', type: 'transfer' },
      { id: '2', from: 'Salary', to: 'Main Account', amount: 3200, date: '2024-01-10', type: 'credit' },
      { id: '3', from: 'Main Account', to: 'Electricity Bill', amount: -85.50, date: '2024-01-08', type: 'debit' }
    ],
    investments: [
      { id: '1', symbol: 'AAPL', name: 'Apple Inc.', shares: 10, currentPrice: 185.50, totalValue: 1855.00, change: '+2.5%' },
      { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', shares: 5, currentPrice: 245.30, totalValue: 1226.50, change: '-1.2%' },
      { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 8, currentPrice: 380.25, totalValue: 3042.00, change: '+0.8%' }
    ],
    monthlySavings: 850.00,
    investmentValue: 6123.50
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('auth_token')
        if (token) {
          accountService.setAuthToken(token)
        } else {
          setError('Authentication required. Please login again.')
          router.push('/login')
          return
        }

        const response = await accountService.getUserAccounts()

        if (response.success && response.accounts) {
          setAccounts(response.accounts)
        } else {
          setError(response.error || 'Failed to load accounts')
        }
      } catch (err) {
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
  }, [])

  const handleAccountCreated = () => {
    // Reload accounts after creation
    const reloadAccounts = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          accountService.setAuthToken(token)
        }

        const response = await accountService.getUserAccounts()

        if (response.success && response.accounts) {
          setAccounts(response.accounts)
        }
      } catch (err) {
        console.error('Failed to reload accounts:', err)
      }
    }

    reloadAccounts()
  }

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account)
    setIsEditDialogOpen(true)
  }

  const handleDeleteAccount = (account: Account) => {
    setSelectedAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: ArrowUpDown },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'contact', label: 'Contact', icon: MessageSquare }
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
            Welcome to your client space
          </h1>
          <p className="text-muted-foreground/80 text-lg">
            Manage your accounts, investments and savings securely
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold text-foreground">{totalBalance.toLocaleString('fr-FR')} €</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Savings</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.monthlySavings.toLocaleString('fr-FR')} €</p>
                </div>
                <PiggyBank className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio</p>
                  <p className="text-2xl font-bold text-foreground">{mockData.investmentValue.toLocaleString('fr-FR')} €</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
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
              {/* Accounts Summary */}
              <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>My Accounts</span>
                  </CardTitle>
                  <CardDescription>Overview of your accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading accounts...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : accounts.length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="h-8 w-8 text-primary" />
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No accounts yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Create your first account to get started
                      </p>

                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Account
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      {accounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-border/30">
                          <div>
                            <p className="font-medium text-foreground">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.iban}</p>
                            {account.isSavings && (
                              <p className="text-xs text-green-600">Savings Account</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{account.balance.toLocaleString('fr-FR')} €</p>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="w-full mt-4 bg-primary/90 hover:bg-primary/80"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Account
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Transactions</span>
                  </CardTitle>
                  <CardDescription>Your latest transactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockData.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-border/30">
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.type === 'transfer' ? `${transaction.from} → ${transaction.to}` : transaction.from}
                        </p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4">
                    View All Transactions
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'accounts' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Account Management</span>
                  </span>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary/90 hover:bg-primary/80"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Account
                  </Button>
                </CardTitle>
                <CardDescription>Create, modify or delete your accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading accounts...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : accounts.length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No accounts found
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Create your first account to start managing your finances
                      </p>

                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Account
                      </Button>
                    </motion.div>
                  ) : (
                    accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{account.name}</p>
                              <p className="text-sm text-muted-foreground">{account.iban}</p>
                              <p className="text-xs text-muted-foreground">
                                {account.isSavings ? 'Savings Account' : 'Current Account'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <p className="text-xl font-bold text-foreground">{account.balance.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAccount(account)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'investments' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Stock Portfolio</span>
                  </span>
                  <Button className="bg-primary/90 hover:bg-primary/80">
                    <Plus className="mr-2 h-4 w-4" />
                    New Order
                  </Button>
                </CardTitle>
                <CardDescription>Manage your stock investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.investments.map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{investment.symbol} - {investment.name}</p>
                            <p className="text-sm text-muted-foreground">{investment.shares} shares at {investment.currentPrice} €</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-xl font-bold text-foreground">{investment.totalValue.toLocaleString('fr-FR')} €</p>
                        <p className={`text-sm ${investment.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {investment.change}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Sell
                        </Button>
                        <Button variant="outline" size="sm">
                          Buy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'savings' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PiggyBank className="h-5 w-5" />
                  <span>Savings Accounts</span>
                </CardTitle>
                <CardDescription>Your interest-bearing accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading accounts...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : accounts.filter(account => account.isSavings).length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <PiggyBank className="h-8 w-8 text-blue-500" />
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No savings accounts
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Open a savings account to grow your money
                      </p>

                      <Button
                        onClick={() => setIsSavingsDialogOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                      >
                        <PiggyBank className="mr-2 h-4 w-4" />
                        Open Savings Account
                      </Button>
                    </motion.div>
                  ) : (
                    accounts.filter(account => account.isSavings).map((account) => (
                      <div key={account.id} className="p-4 bg-background/60 rounded-lg border border-border/30">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-foreground">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.iban}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">{account.balance.toLocaleString('fr-FR')} €</p>
                            <p className="text-sm text-green-600">Savings Account</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-background/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">Account Type</p>
                            <p className="font-semibold text-green-600">Savings</p>
                          </div>
                          <div className="text-center p-3 bg-background/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="font-semibold text-muted-foreground">{new Date(account.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Button
                    onClick={() => setIsSavingsDialogOpen(true)}
                    className="w-full bg-primary/90 hover:bg-primary/80"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Open a Savings Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'contact' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Contact Support</span>
                </CardTitle>
                <CardDescription>Chat with our advisors in real-time</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DashboardChat />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <CreateAccountDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        isSavings={false}
        onAccountCreated={handleAccountCreated}
      />

      <CreateAccountDialog
        isOpen={isSavingsDialogOpen}
        onClose={() => setIsSavingsDialogOpen(false)}
        isSavings={true}
        onAccountCreated={handleAccountCreated}
      />

      <EditAccountDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        accountId={selectedAccount?.id || ''}
        currentName={selectedAccount?.name || ''}
        onAccountUpdated={handleAccountCreated}
      />

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        accountToDelete={selectedAccount}
        userAccounts={accounts}
        onAccountDeleted={handleAccountCreated}
      />
    </div>
  )
}
