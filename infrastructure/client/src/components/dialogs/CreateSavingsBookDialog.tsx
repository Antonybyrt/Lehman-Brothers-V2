"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, PiggyBank, Loader2, BookOpen, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { savingsBookService, SavingsBookType, SavingsRate } from "@/services/savingsBookService"
import toast from "react-hot-toast"

interface CreateSavingsBookDialogProps {
    isOpen: boolean
    onClose: () => void
    onSavingsBookCreated?: () => void
    existingTypes?: SavingsBookType[]
}

const SAVINGS_BOOK_TYPES: { type: SavingsBookType; name: string; description: string; icon: React.ReactNode; color: string }[] = [
    {
        type: 'LIVRET_A',
        name: 'Livret A',
        description: 'The classic savings account, tax-free',
        icon: <BookOpen className="h-5 w-5" />,
        color: 'blue'
    },
    {
        type: 'LDD',
        name: 'Livret Développement Durable',
        description: 'Eco-friendly savings for sustainable projects',
        icon: <Leaf className="h-5 w-5" />,
        color: 'green'
    }
]

export function CreateSavingsBookDialog({
    isOpen,
    onClose,
    onSavingsBookCreated,
    existingTypes = []
}: CreateSavingsBookDialogProps) {
    // Determine the first available type
    const availableTypes = SAVINGS_BOOK_TYPES.filter(t => !existingTypes.includes(t.type));
    const defaultType = availableTypes.length > 0 ? availableTypes[0].type : 'LIVRET_A';

    const [formData, setFormData] = useState({
        name: '',
        type: defaultType
    })

    // Update default type when dialog opens or existingTypes changes
    useEffect(() => {
        if (isOpen) {
            const currentAvailable = SAVINGS_BOOK_TYPES.filter(t => !existingTypes.includes(t.type));
            if (currentAvailable.length > 0) {
                setFormData(prev => ({ ...prev, type: currentAvailable[0].type }));
            }
        }
    }, [isOpen, existingTypes]);
    const [rates, setRates] = useState<SavingsRate[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingRates, setLoadingRates] = useState(true)

    useEffect(() => {
        if (isOpen) {
            loadRates()
        }
    }, [isOpen])

    const loadRates = async () => {
        setLoadingRates(true)
        try {
            const token = localStorage.getItem('auth_token')
            if (token) {
                savingsBookService.setAuthToken(token)
            }

            const response = await savingsBookService.getCurrentRates()
            if (response.success && response.rates) {
                setRates(response.rates)
            }
        } catch (error) {
            console.error('Failed to load rates:', error)
        } finally {
            setLoadingRates(false)
        }
    }

    const getCurrentRate = (type: SavingsBookType): string => {
        const rate = rates.find(r => r.bookType === type)
        return rate ? rate.ratePercent : 'N/A'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Account name is required')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('auth_token')
            if (token) {
                savingsBookService.setAuthToken(token)
            }

            const response = await savingsBookService.createSavingsBook({
                name: formData.name.trim(),
                type: formData.type
            })

            if (response.success) {
                const typeName = SAVINGS_BOOK_TYPES.find(t => t.type === formData.type)?.name || formData.type
                toast.success(`${typeName} created successfully!`)
                setFormData({ name: '', type: 'LIVRET_A' })
                onSavingsBookCreated?.()
                onClose()
            } else {
                toast.error(response.error || 'Failed to create savings book')
            }
        } catch {
            toast.error('Network error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            setFormData({ name: '', type: 'LIVRET_A' })
            onClose()
        }
    }

    const selectedType = SAVINGS_BOOK_TYPES.find(t => t.type === formData.type)

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-lg mx-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border/30">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                                    <PiggyBank className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Open a Savings Book
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Choose your savings type
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                disabled={loading}
                                className="h-8 w-8 p-0 hover:bg-background/60"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Savings Book Type Selection */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-foreground">
                                    Type of Savings Book
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {SAVINGS_BOOK_TYPES.map((typeOption) => {
                                        const isOwned = existingTypes.includes(typeOption.type);
                                        // Skip rendering if already owned, or render disabled
                                        if (isOwned) return null;

                                        const isSelected = formData.type === typeOption.type
                                        const rate = getCurrentRate(typeOption.type)

                                        return (
                                            <button
                                                key={typeOption.type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type: typeOption.type }))}
                                                className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                                                    ? typeOption.color === 'blue'
                                                        ? 'border-blue-500 bg-blue-500/10'
                                                        : 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-border/50 bg-background/40 hover:border-border'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${typeOption.color === 'blue'
                                                    ? 'bg-blue-500/20 text-blue-500'
                                                    : 'bg-emerald-500/20 text-emerald-500'
                                                    }`}>
                                                    {typeOption.icon}
                                                </div>
                                                <p className="font-semibold text-foreground text-sm">{typeOption.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{typeOption.description}</p>

                                                {/* Current Rate Badge */}
                                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${typeOption.color === 'blue'
                                                    ? 'bg-blue-500/20 text-blue-600'
                                                    : 'bg-emerald-500/20 text-emerald-600'
                                                    }`}>
                                                    {loadingRates ? '...' : rate}
                                                </div>

                                                {/* Selection Indicator */}
                                                {isSelected && (
                                                    <motion.div
                                                        layoutId="selected-type"
                                                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${typeOption.color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                                                            }`}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                    >
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </motion.div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Account Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                    Account Name *
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder={`e.g., My ${selectedType?.name || 'Savings Book'}...`}
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={loading}
                                    className="bg-background/60 border-border/30 focus:border-primary/50"
                                    required
                                />
                            </div>

                            {/* Info Box */}
                            <div className={`p-4 rounded-lg ${selectedType?.color === 'blue'
                                ? 'bg-blue-500/10 border border-blue-500/30'
                                : 'bg-emerald-500/10 border border-emerald-500/30'
                                }`}>
                                <div className="flex items-start space-x-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedType?.color === 'blue'
                                        ? 'bg-blue-500/20 text-blue-500'
                                        : 'bg-emerald-500/20 text-emerald-500'
                                        }`}>
                                        ℹ️
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Current Rate: {loadingRates ? 'Loading...' : getCurrentRate(formData.type)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Interest is calculated and applied daily. You will be notified of any rate changes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 border-border/30 hover:bg-background/60"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !formData.name.trim()}
                                    className={`flex-1 text-white ${selectedType?.color === 'blue'
                                        ? 'bg-blue-500 hover:bg-blue-600'
                                        : 'bg-emerald-500 hover:bg-emerald-600'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <PiggyBank className="mr-2 h-4 w-4" />
                                            Open {selectedType?.name}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
