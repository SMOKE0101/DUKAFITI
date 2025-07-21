
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSupabaseCustomers, Customer } from '../../hooks/useSupabaseCustomers';
import { useSupabaseDebtPayments } from '../../hooks/useSupabaseDebtPayments';
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from '../../utils/currency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from '@/hooks/use-mobile';
import PaymentModal from './PaymentModal';

const CustomersPage = () => {
  const [search, setSearch] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useSupabaseCustomers();
  const { createDebtPayment } = useSupabaseDebtPayments();
  const { toast } = useToast()

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error,
      })
    }
  }, [error, toast]);

  const filteredCustomers = React.useMemo(
    () => {
      return customers.filter((customer) => {
        return customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.phone.toLowerCase().includes(search.toLowerCase()) ||
          customer.address?.toLowerCase().includes(search.toLowerCase())
      })
    }, [search, customers]
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Please fill all required fields.",
      })
      return;
    }

    if (isEditMode && selectedCustomer) {
      try {
        await updateCustomer(selectedCustomer.id, {
          name,
          phone,
          address,
        });

        toast({
          title: "Success!",
          description: "Customer updated successfully.",
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: error.message,
        })
      }
    } else {
      try {
        await createCustomer({
          name,
          phone,
          address,
          email: '',
          createdDate: new Date().toISOString(),
          totalPurchases: 0,
          outstandingDebt: 0,
          creditLimit: 1000,
          lastPurchaseDate: null,
          riskRating: 'low',
        });

        toast({
          title: "Success!",
          description: "Customer created successfully.",
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: error.message,
        })
      }
    }

    setOpen(false);
    setName("");
    setPhone("");
    setAddress("");
    setIsEditMode(false);
    setSelectedCustomer(null);
  }

  const onEdit = (customer: Customer) => {
    setIsEditMode(true);
    setSelectedCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || '');
    setOpen(true);
  }

  const onDelete = async (id: string) => {
    try {
      await deleteCustomer(id);

      toast({
        title: "Success!",
        description: "Customer deleted successfully.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.message,
      })
    }
  }

  const handlePayment = async (customerId: string, paymentData: { amount: number; method: string; notes?: string }) => {
    try {
      setIsRecordingPayment(true);
      
      const customer = customers.find(c => c.id === customerId);
      if (!customer) throw new Error('Customer not found');

      // Create the debt payment record
      await createDebtPayment({
        user_id: customer.id, // This will be set correctly in the hook
        customer_id: customerId,
        customer_name: customer.name,
        amount: paymentData.amount,
        payment_method: paymentData.method,
        reference: paymentData.notes || '',
        timestamp: new Date().toISOString()
      });

      // Update customer's outstanding debt
      const newOutstandingDebt = Math.max(0, customer.outstandingDebt - paymentData.amount);
      await updateCustomer(customerId, {
        outstandingDebt: newOutstandingDebt
      });

      setSelectedCustomer(null);
      setIsRecordingPayment(false);
      
      toast({
        title: "Payment Recorded",
        description: "Payment recorded successfully",
      })
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.message,
      })
      setIsRecordingPayment(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Customer" : "Add Customer"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Make changes to your customer here. Click save when you're done." : "Create a new customer here. Click save when you're done."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input type="number" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <Button onClick={onSubmit} type="submit">{isEditMode ? "Update" : "Save changes"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Debt</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {Array(5).fill(null).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell className="text-right"><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              <>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.outstandingDebt || 0)}</TableCell>
                    <TableCell className="text-center">
                      {customer.outstandingDebt > 0 ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge variant="secondary">Clear</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEdit(customer)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(customer.id)}>
                            <Trash className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                            Record Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="p-2">
                {loading ? (
                  <Skeleton className="w-[100px]" />
                ) : (
                  `${filteredCustomers.length} row(s).`
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onPayment={(paymentData) => selectedCustomer && handlePayment(selectedCustomer.id, paymentData)}
        isRecording={isRecordingPayment}
      />
    </div>
  )
}

export default CustomersPage;
