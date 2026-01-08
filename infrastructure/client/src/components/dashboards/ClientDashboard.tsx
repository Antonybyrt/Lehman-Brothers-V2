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
  MessageSquare,
  ArrowRightLeft,
  BookOpen,
  Leaf
} from "lucide-react"
import { accountService, Account } from "@/services/accountService"
import { savingsBookService, SavingsBook, SavingsRate } from "@/services/savingsBookService"
import { transactionService, Transaction } from "@/services/transactionService"
import { CreateAccountDialog, EditAccountDialog, DeleteAccountDialog, TransferAccountDialog, BuyStockDialog, SellStockDialog, CreateSavingsBookDialog } from "@/components/dialogs"
import { MarketView } from './MarketView';
import { ChatContainer } from "@/components/chat/ChatContainer"
import { useTranslations } from 'next-intl'
import { useInvestment } from "@/hooks/useInvestment"
import { Stock } from "@/services/investmentService"

interface ClientDashboardProps {
  user: any;
}

export default function ClientDashboard() {
  const router = useRouter()
  const t = useTranslations('dashboard.client')
  const tCommon = useTranslations('common')
  const [activeTab, setActiveTab] = useState('overview')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [savingsBooks, setSavingsBooks] = useState<SavingsBook[]>([])
  const [savingsRates, setSavingsRates] = useState<SavingsRate[]>([])
  const [loading, setLoading] = useState(true)

  const { stocks, portfolio, orders, fetchStocks, fetchPortfolio, fetchUserOrders } = useInvestment();

  const refreshData = async () => {
    // Refresh all data: Accounts, Portfolio, Orders
    const token = localStorage.getItem('auth_token')
    if (token) {
      accountService.setAuthToken(token)
      const response = await accountService.getUserAccounts()
      if (response.success && response.accounts) {
        setAccounts(response.accounts)
      }
    }
    await fetchPortfolio();
    await fetchUserOrders();
  };

  useEffect(() => {
    if (activeTab === 'investments') {
      fetchStocks();
      fetchPortfolio();
      fetchUserOrders();
    }
  }, [activeTab, fetchStocks, fetchPortfolio, fetchUserOrders]);
  const [loadingSavings, setLoadingSavings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [isCreateSavingsBookDialogOpen, setIsCreateSavingsBookDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isBuyStockOpen, setIsBuyStockOpen] = useState(false)
  const [isSellStockOpen, setIsSellStockOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedStockToSell, setSelectedStockToSell] = useState<Stock | null>(null)
  const [maxSellQuantity, setMaxSellQuantity] = useState<number>(0)
  const [investmentTab, setInvestmentTab] = useState<'portfolio' | 'orders'>('portfolio');
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  // Mock data for investments (transactions now come from real data)
  const mockData = {
    investments: [
      { id: '1', symbol: 'AAPL', name: 'Apple Inc.', shares: 10, currentPrice: 185.50, totalValue: 1855.00, change: '+2.5%' },
      { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', shares: 5, currentPrice: 245.30, totalValue: 1226.50, change: '-1.2%' },
      { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 8, currentPrice: 380.25, totalValue: 3042.00, change: '+0.8%' }
    ],
    investmentValue: 6123.50
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const totalSavingsBalance = savingsBooks.reduce((sum, book) => sum + book.balance, 0)

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
      } catch {
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
    loadSavingsBooks()
    // Fetch investment data for stats
    fetchStocks()
    fetchPortfolio()
    loadTransactions()
  }, [router, fetchStocks, fetchPortfolio])

  const totalInvestmentValue = portfolio?.holdings.reduce((total, holding) => {
    const stock = stocks.find(s => s.id === holding.stockId);
    return total + (holding.quantity * (stock?.currentPrice || 0));
  }, 0) || 0;

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const token = localStorage.getItem('auth_token')
      if (token) {
        transactionService.setAuthToken(token)
      }

      const response = await transactionService.getUserTransactions(20)
      if (response.success && response.transactions) {
        setTransactions(response.transactions)
      }
    } catch {
      console.error('Failed to load transactions')
    } finally {
      setLoadingTransactions(false)
    }
  }

  const loadSavingsBooks = async () => {
    try {
      setLoadingSavings(true)
      const token = localStorage.getItem('auth_token')
      if (token) {
        savingsBookService.setAuthToken(token)
      }

      const [booksResponse, ratesResponse] = await Promise.all([
        savingsBookService.getUserSavingsBooks(),
        savingsBookService.getCurrentRates()
      ])

      if (booksResponse.success && booksResponse.savingsBooks) {
        setSavingsBooks(booksResponse.savingsBooks)
      }

      if (ratesResponse.success && ratesResponse.rates) {
        setSavingsRates(ratesResponse.rates)
      }
    } catch {
      console.error('Failed to load savings books')
    } finally {
      setLoadingSavings(false)
    }
  }

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
    // Also reload savings books in case a savings account was affected
    loadSavingsBooks()
    // Reload transactions to show new transaction
    loadTransactions()
  }

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account)
    setIsEditDialogOpen(true)
  }

  const handleDeleteAccount = (account: Account) => {
    setSelectedAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const handleTransferAccount = (account: Account) => {
    setSelectedAccount(account)
    setIsTransferDialogOpen(true)
  }

  const tabs = [
    { id: 'overview', label: t('tabs.overview'), icon: BarChart3 },
    { id: 'accounts', label: t('tabs.accounts'), icon: CreditCard },
    { id: 'transactions', label: t('tabs.transactions'), icon: ArrowUpDown },
    { id: 'investments', label: t('tabs.investments'), icon: TrendingUp },
    { id: 'savings', label: t('tabs.savings'), icon: PiggyBank },
    { id: 'contact', label: t('tabs.chat'), icon: MessageSquare }
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
            {t('welcome')}
          </h1>
          <p className="text-muted-foreground/80 text-lg">
            {t('title')}
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
                  <p className="text-sm text-muted-foreground">{t('stats.totalBalance')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('stats.monthlySavings')}</p>
                  <p className="text-2xl font-bold text-foreground">{totalSavingsBalance.toLocaleString('fr-FR')} €</p>
                </div>
                <PiggyBank className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.investmentValue')}</p>
                  <p className="text-2xl font-bold text-foreground">{totalInvestmentValue.toLocaleString('fr-FR')} €</p>
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
                    <span>{t('accounts.title')}</span>
                  </CardTitle>
                  <CardDescription>{t('title')}</CardDescription>
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
                        {t('accounts.noAccounts')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('accounts.createFirst')}
                      </p>

                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('accounts.createNew')}
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
                              <p className="text-xs text-green-600">{t('accounts.savings')}</p>
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
                        {t('accounts.createNew')}
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
                    <span>{t('transactions.title')}</span>
                  </CardTitle>
                  <CardDescription>{t('title')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="ml-2 text-sm">Loading...</span>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">{t('transactions.noTransactions')}</p>
                    </div>
                  ) : (
                    transactions.slice(0, 3).map((tx) => {
                      const isOutgoing = tx.sourceAccountName !== undefined;
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-background/60 rounded-lg border border-border/30">
                          <div>
                            <p className="font-medium text-foreground">
                              {tx.sourceAccountName || 'External'} → {tx.targetAccountName || tx.targetIban?.substring(0, 10) + '...' || 'External'}
                            </p>
                            <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                              {isOutgoing ? '-' : '+'}{tx.amount.toLocaleString('fr-FR')} €
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('transactions')}>
                    {tCommon('viewAll')}
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
                    <span>{t('accounts.title')}</span>
                  </span>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary/90 hover:bg-primary/80"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('accounts.createNew')}
                  </Button>
                </CardTitle>
                <CardDescription>{t('title')}</CardDescription>
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
                        {t('accounts.noAccounts')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('accounts.createFirst')}
                      </p>

                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('accounts.createNew')}
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
                                {account.isSavings ? t('accounts.savings') : t('accounts.current')}
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
                            onClick={() => handleTransferAccount(account)}
                            className="text-primary hover:text-primary"
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            {t('accounts.balance')}
                          </Button>
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
                            {tCommon('delete')}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Savings Books Section */}
                  {savingsBooks.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                          <PiggyBank className="h-5 w-5 mr-2" />
                          {t('accounts.savingsTitle')}
                        </h3>
                        {savingsBooks.length < 2 && (
                          <Button
                            onClick={() => setIsCreateSavingsBookDialogOpen(true)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('accounts.createSavings')}
                          </Button>
                        )}
                      </div>
                      {savingsBooks.map((book) => {
                        const rate = savingsRates.find(r => r.bookType === book.type);
                        return (
                          <div key={book.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center">
                                  <PiggyBank className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{book.name}</p>
                                  <p className="text-sm text-muted-foreground">{book.iban}</p>
                                  <p className="text-xs text-green-600">
                                    {book.typeDisplayName} • {rate ? `${(rate.rate * 100).toFixed(2)}%` : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-foreground">{book.balance.toLocaleString('fr-FR')} €</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'transactions' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <ArrowUpDown className="h-5 w-5" />
                    <span>{t('transactions.title')}</span>
                  </span>
                  {accounts.length > 0 && (
                    <Button
                      onClick={() => {
                        setSelectedAccount(accounts[0])
                        setIsTransferDialogOpen(true)
                      }}
                      className="bg-primary/90 hover:bg-primary/80"
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      {t('transactions.newTransfer')}
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>{t('title')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading transactions...</span>
                    </div>
                  ) : accounts.length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ArrowUpDown className="h-8 w-8 text-primary" />
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t('accounts.noAccounts')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('accounts.createFirst')}
                      </p>

                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('accounts.createNew')}
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      {/* Quick Transfer Section */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                        {accounts.map((account) => (
                          <motion.div
                            key={account.id}
                            className="p-4 bg-background/60 rounded-lg border border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              setSelectedAccount(account)
                              setIsTransferDialogOpen(true)
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{account.name}</span>
                              </div>
                              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-bold text-foreground">{account.balance.toLocaleString('fr-FR')} €</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to transfer</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Recent Transactions */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">{t('transactions.title')}</h4>
                        {loadingTransactions ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="ml-2 text-sm">Loading transactions...</span>
                          </div>
                        ) : transactions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>{t('transactions.noTransactions')}</p>
                          </div>
                        ) : (
                          transactions.map((tx) => {
                            const isOutgoing = tx.sourceAccountName !== undefined;
                            return (
                              <div key={tx.id} className="flex items-center justify-between p-4 bg-background/60 rounded-lg border border-border/30">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOutgoing ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                    {isOutgoing ? (
                                      <ArrowUpDown className="h-5 w-5 text-red-500" />
                                    ) : (
                                      <TrendingUp className="h-5 w-5 text-green-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {tx.sourceAccountName || 'External'} → {tx.targetAccountName || tx.targetIban?.substring(0, 12) + '...' || 'External'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                                      {tx.description && ` • ${tx.description}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                                    {isOutgoing ? '-' : '+'}{tx.amount.toLocaleString('fr-FR')} €
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'investments' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">{t('investments.title')}</h2>
                  <div className="flex gap-4">
                    <div className="flex bg-white/5 rounded-lg p-1">
                      <button
                        onClick={() => setInvestmentTab('portfolio')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${investmentTab === 'portfolio'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white'
                          }`}
                      >
                        {t('investments.portfolio')}
                      </button>
                      <button
                        onClick={() => setInvestmentTab('orders')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${investmentTab === 'orders'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white'
                          }`}
                      >
                        {t('investments.market')}
                      </button>
                    </div>
                  </div>
                </div>

                {investmentTab === 'portfolio' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('investments.symbol')}</th>
                          <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('investments.name')}</th>
                          <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('investments.shares')}</th>
                          <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('investments.currentPrice')}</th>
                          <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('investments.totalValue')}</th>
                          <th className="p-4 text-xs font-medium text-white/50 uppercase">{tCommon('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {!portfolio || portfolio.holdings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-white/50">
                              {t('investments.noInvestments')}
                            </td>
                          </tr>
                        ) : (
                          portfolio.holdings.map((holding) => {
                            const stock = stocks.find(s => s.id === holding.stockId);
                            if (!stock) return null;
                            const totalValue = holding.quantity * stock.currentPrice;

                            return (
                              <tr key={holding.stockId} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-white font-medium">{stock.symbol}</td>
                                <td className="p-4 text-white">{stock.name}</td>
                                <td className="p-4 text-white">{holding.quantity}</td>
                                <td className="p-4 text-white">
                                  {(stock.currentPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="p-4 text-white font-bold">
                                  {(totalValue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="p-4">
                                  <button
                                    onClick={() => {
                                      setSelectedStockToSell(stock);
                                      setMaxSellQuantity(holding.quantity);
                                      setIsSellStockOpen(true);
                                    }}
                                    className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                                  >
                                    {t('investments.sell')}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <MarketView
                    stocks={stocks}
                    orders={orders}
                    onRefresh={refreshData}
                    accounts={accounts}
                    portfolio={portfolio}
                  />
                )}
              </div>
              <BuyStockDialog
                open={isBuyStockOpen}
                onOpenChange={setIsBuyStockOpen}
                accounts={accounts}
                onSuccess={refreshData}
              />
              <SellStockDialog
                open={isSellStockOpen}
                onOpenChange={setIsSellStockOpen}
                stock={selectedStockToSell}
                maxQuantity={maxSellQuantity}
                onSuccess={refreshData}
              />
            </Card>
          )}

          {activeTab === 'savings' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="h-5 w-5" />
                    <span>{t('accounts.savingsTitle')}</span>
                  </div>
                  {savingsBooks.length < 2 && (
                    <Button
                      onClick={() => setIsCreateSavingsBookDialogOpen(true)}
                      className="bg-primary/90 hover:bg-primary/80"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('accounts.createSavings')}
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>{t('title')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingSavings ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading savings books...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : savingsBooks.length === 0 ? (
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
                        {t('accounts.noSavingsAccounts')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('accounts.createFirstSavings')}
                      </p>

                      <Button
                        onClick={() => setIsCreateSavingsBookDialogOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                      >
                        <PiggyBank className="mr-2 h-4 w-4" />
                        {t('accounts.createSavings')}
                      </Button>
                    </motion.div>
                  ) : (
                    savingsBooks.map((book) => {
                      const rate = savingsRates.find(r => r.bookType === book.type);
                      return (
                        <div key={book.id} className="p-4 bg-background/60 rounded-lg border border-border/30">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-semibold text-foreground">{book.name}</p>
                              <p className="text-sm text-muted-foreground">{book.iban}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground">{book.balance.toLocaleString('fr-FR')} €</p>
                              <p className="text-sm text-green-600">{book.typeDisplayName}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-background/40 rounded-lg">
                              <p className="text-sm text-muted-foreground">Interest Rate</p>
                              <p className="font-semibold text-green-600">
                                {rate ? `${(rate.rate * 100).toFixed(2)}%` : 'N/A'}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-background/40 rounded-lg">
                              <p className="text-sm text-muted-foreground">Created</p>
                              <p className="font-semibold text-muted-foreground">{new Date(book.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'contact' && (
            <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{t('tabs.chat')}</span>
                </CardTitle>
                <CardDescription>{t('title')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ChatContainer />
              </CardContent>
            </Card>
          )}
        </motion.div>

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

        <TransferAccountDialog
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          sourceAccount={selectedAccount}
          userAccounts={accounts}
          onTransferComplete={handleAccountCreated}
        />
      </div>

      <CreateSavingsBookDialog
        isOpen={isCreateSavingsBookDialogOpen}
        onClose={() => setIsCreateSavingsBookDialogOpen(false)}
        onSavingsBookCreated={loadSavingsBooks}
        existingTypes={savingsBooks.map(b => b.type)}
      />
    </div>
  )
}
