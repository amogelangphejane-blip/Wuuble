import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  Gift,
  AlertTriangle
} from 'lucide-react';
import { WalletTransaction, TransactionFilter } from '@/types/wallet';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TransactionsListProps {
  transactions: WalletTransaction[];
  showPagination?: boolean;
  onFilterChange?: (filter: TransactionFilter) => void;
}

export function TransactionsList({ 
  transactions, 
  showPagination = false,
  onFilterChange 
}: TransactionsListProps) {
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'subscription_payment':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'platform_fee':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case 'payout':
        return <ArrowDownRight className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <ArrowDownRight className="h-4 w-4 text-orange-600" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-purple-600" />;
      case 'adjustment':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionDescription = (transaction: WalletTransaction) => {
    if (transaction.description) {
      return transaction.description;
    }

    switch (transaction.transaction_type) {
      case 'subscription_payment':
        return 'Subscription payment received';
      case 'platform_fee':
        return 'Platform fee deducted';
      case 'payout':
        return 'Payout to your account';
      case 'refund':
        return 'Payment refunded';
      case 'bonus':
        return 'Bonus payment';
      case 'adjustment':
        return 'Balance adjustment';
      default:
        return 'Transaction';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const description = getTransactionDescription(transaction).toLowerCase();
      if (!description.includes(searchLower) && 
          !transaction.transaction_type.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filter.transaction_type && transaction.transaction_type !== filter.transaction_type) {
      return false;
    }

    if (filter.status && transaction.status !== filter.status) {
      return false;
    }

    return true;
  });

  const paginatedTransactions = showPagination
    ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTransactions;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleFilterChange = (newFilter: Partial<TransactionFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange?.(updatedFilter);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select 
          value={filter.transaction_type || 'all'} 
          onValueChange={(value) => handleFilterChange({ 
            transaction_type: value === 'all' ? undefined : value as any 
          })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="subscription_payment">Payments</SelectItem>
            <SelectItem value="platform_fee">Platform Fees</SelectItem>
            <SelectItem value="payout">Payouts</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
            <SelectItem value="bonus">Bonuses</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filter.status || 'all'} 
          onValueChange={(value) => handleFilterChange({ 
            status: value === 'all' ? undefined : value as any 
          })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchTerm || filter.transaction_type || filter.status
                ? 'Try adjusting your filters to see more results.'
                : 'Your transactions will appear here once you start receiving payments.'
              }
            </p>
          </div>
        ) : (
          paginatedTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {getTransactionIcon(transaction.transaction_type)}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {getTransactionDescription(transaction)}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(transaction.processed_at)}</span>
                    {transaction.reference_type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{transaction.reference_type.replace('_', ' ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className={`font-semibold ${getTransactionColor(transaction.transaction_type, transaction.amount)}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}