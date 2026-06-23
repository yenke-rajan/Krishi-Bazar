import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { 
  useGetOrders, getGetOrdersQueryKey, useUpdateOrderStatus,
  useGetCatalog, getGetCatalogQueryKey, useCreateCatalogItem, useUpdateCatalogItem,
  useGetInventory, getGetInventoryQueryKey, useLogInventory 
} from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowLeft, Plus, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  CatalogItemInputCategory, 
  InventoryInputTrackingType,
  OrderStatusUpdateStatus 
} from '@workspace/api-client-react';

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const isNp = i18n.language === 'np';

  // Queries
  const { data: orders, isLoading: ordersLoading } = useGetOrders({
    query: { enabled: !!token, queryKey: getGetOrdersQueryKey() }
  });
  
  const { data: catalog, isLoading: catalogLoading } = useGetCatalog({
    query: { enabled: !!token, queryKey: getGetCatalogQueryKey() }
  });
  
  const { data: inventory, isLoading: inventoryLoading } = useGetInventory({
    query: { enabled: !!token, queryKey: getGetInventoryQueryKey() }
  });

  // Mutations
  const updateOrder = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        toast.success("Order status updated");
      }
    }
  });

  const createItem = useCreateCatalogItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
        setNewItemData({ crop_name: '', crop_name_np: '', category: CatalogItemInputCategory.VEGETABLE });
        toast.success("Catalog item created");
      }
    }
  });

  const updateItem = useUpdateCatalogItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
        toast.success("Catalog updated");
      }
    }
  });

  const logInventory = useLogInventory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        setNewLogData({ crop_id: '', delta_quantity: '', tracking_type: InventoryInputTrackingType.RECEIVED, notes: '' });
        toast.success("Inventory logged successfully");
      }
    }
  });

  // Forms State
  const [newItemData, setNewItemData] = useState({
    crop_name: '',
    crop_name_np: '',
    category: CatalogItemInputCategory.VEGETABLE
  });

  const [newLogData, setNewLogData] = useState({
    crop_id: '',
    delta_quantity: '',
    tracking_type: InventoryInputTrackingType.RECEIVED,
    notes: ''
  });

  const handleCreateCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.crop_name || !newItemData.crop_name_np) {
      toast.error("Both EN and NP names are required");
      return;
    }
    createItem.mutate({ data: newItemData });
  };

  const handleLogInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogData.crop_id || !newLogData.delta_quantity) {
      toast.error("Crop and quantity are required");
      return;
    }
    logInventory.mutate({ 
      data: {
        crop_id: newLogData.crop_id,
        delta_quantity: Number(newLogData.delta_quantity),
        tracking_type: newLogData.tracking_type,
        notes: newLogData.notes || undefined
      }
    });
  };

  const supplyOrders = orders?.filter(o => o.layer_type === 'SUPPLY') || [];
  const demandOrders = orders?.filter(o => o.layer_type === 'DEMAND') || [];

  return (
    <div className="min-h-screen bg-kb-cream w-full font-sans text-kb-text flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 bg-kb-deep text-white p-6 shrink-0 md:h-screen sticky top-0 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-xl">Command Center</h1>
        </div>
        
        <p className="text-white/60 text-sm mb-6">Manage KrishiBazar operations, orders, and market catalog.</p>
        
        <div className="mt-auto pt-6 border-t border-white/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" />
            {t('nav.logout')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-6 bg-white border border-kb-border h-12 p-1">
            <TabsTrigger value="orders" className="data-[state=active]:bg-kb-forest data-[state=active]:text-white h-full px-6">Orders</TabsTrigger>
            <TabsTrigger value="catalog" className="data-[state=active]:bg-kb-forest data-[state=active]:text-white h-full px-6">Catalog</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-kb-forest data-[state=active]:text-white h-full px-6">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Supply Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-kb-border overflow-hidden flex flex-col h-[700px]">
                <div className="bg-kb-cream p-4 border-b border-kb-border">
                  <h2 className="font-bold text-lg text-kb-deep">Active Supply Orders</h2>
                  <p className="text-sm text-kb-muted">Farmers offering produce</p>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                  {supplyOrders.length === 0 ? (
                    <p className="text-kb-muted text-center py-8">No supply orders</p>
                  ) : (
                    supplyOrders.map(order => (
                      <div key={order.id} className="border border-kb-border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-kb-forest">#{order.order_id}</span>
                            <h3 className="font-bold">{isNp ? order.crop_name_np : order.crop_name}</h3>
                            <p className="text-sm font-semibold">{order.weight_kg} {t('common.kg')}</p>
                          </div>
                          <Select 
                            value={order.status} 
                            onValueChange={(val: OrderStatusUpdateStatus) => updateOrder.mutate({ id: order.id, data: { status: val } })}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ORDER_RECEIVED">ORDER_RECEIVED</SelectItem>
                              <SelectItem value="DISPATCHED_TO_COLLECT">DISPATCHED_TO_COLLECT</SelectItem>
                              <SelectItem value="COLLECTED">COLLECTED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-sm bg-kb-cream p-2 rounded">
                          <p className="font-medium">{order.client_name}</p>
                          <p className="text-kb-muted text-xs">{order.client_phone}</p>
                          <p className="text-kb-muted text-xs">{order.client_address}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Demand Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-kb-border overflow-hidden flex flex-col h-[700px]">
                <div className="bg-kb-cream p-4 border-b border-kb-border">
                  <h2 className="font-bold text-lg text-kb-deep">Active Demand Orders</h2>
                  <p className="text-sm text-kb-muted">Wholesalers requesting produce</p>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                  {demandOrders.length === 0 ? (
                    <p className="text-kb-muted text-center py-8">No demand orders</p>
                  ) : (
                    demandOrders.map(order => (
                      <div key={order.id} className="border border-kb-border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-kb-marigold">#{order.order_id}</span>
                            <h3 className="font-bold">{isNp ? order.crop_name_np : order.crop_name}</h3>
                            <p className="text-sm font-semibold">{order.weight_kg} {t('common.kg')}</p>
                          </div>
                          <Select 
                            value={order.status} 
                            onValueChange={(val: OrderStatusUpdateStatus) => updateOrder.mutate({ id: order.id, data: { status: val } })}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ORDER_RECEIVED">ORDER_RECEIVED</SelectItem>
                              <SelectItem value="DISPATCHED">DISPATCHED</SelectItem>
                              <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-sm bg-kb-cream p-2 rounded">
                          <p className="font-medium">{order.client_name}</p>
                          <p className="text-kb-muted text-xs">{order.client_phone}</p>
                          <p className="text-kb-muted text-xs">{order.client_address}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-kb-border p-5 h-fit">
                <h2 className="font-bold text-lg mb-4 text-kb-deep">Add New Crop</h2>
                <form onSubmit={handleCreateCatalogItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label>English Name</Label>
                    <Input 
                      value={newItemData.crop_name} 
                      onChange={e => setNewItemData({...newItemData, crop_name: e.target.value})}
                      placeholder="e.g. Tomato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nepali Name</Label>
                    <Input 
                      value={newItemData.crop_name_np} 
                      onChange={e => setNewItemData({...newItemData, crop_name_np: e.target.value})}
                      placeholder="e.g. गोलभेडा"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newItemData.category}
                      onValueChange={(val: CatalogItemInputCategory) => setNewItemData({...newItemData, category: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VEGETABLE">Vegetable</SelectItem>
                        <SelectItem value="PICKLE">Pickle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-kb-forest hover:bg-kb-deep text-white" disabled={createItem.isPending}>
                    {createItem.isPending ? 'Adding...' : 'Add to Catalog'}
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-kb-border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-kb-cream text-kb-muted uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Crop</th>
                      <th className="px-4 py-3">Nepali</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kb-border/50">
                    {catalog?.map(item => (
                      <tr key={item.id} className="hover:bg-kb-cream/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.crop_name}</td>
                        <td className="px-4 py-3">{item.crop_name_np}</td>
                        <td className="px-4 py-3"><span className="text-[10px] bg-kb-cream text-kb-deep px-2 py-1 rounded font-bold">{item.category}</span></td>
                        <td className="px-4 py-3 text-right">
                          <Switch 
                            checked={item.is_available}
                            onCheckedChange={(checked) => updateItem.mutate({ id: item.id, data: { is_available: checked } })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-kb-border p-5 h-fit">
                <h2 className="font-bold text-lg mb-4 text-kb-deep">Log Inventory Move</h2>
                <form onSubmit={handleLogInventory} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Crop</Label>
                    <Select 
                      value={newLogData.crop_id}
                      onValueChange={(val) => setNewLogData({...newLogData, crop_id: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop..." />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog?.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.crop_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (KG)</Label>
                    <Input 
                      type="number"
                      min="1"
                      value={newLogData.delta_quantity} 
                      onChange={e => setNewLogData({...newLogData, delta_quantity: e.target.value})}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select 
                      value={newLogData.tracking_type}
                      onValueChange={(val: InventoryInputTrackingType) => setNewLogData({...newLogData, tracking_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECEIVED">Received (Add to stock)</SelectItem>
                        <SelectItem value="DELIVERED">Delivered (Remove from stock)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea 
                      value={newLogData.notes}
                      onChange={e => setNewLogData({...newLogData, notes: e.target.value})}
                      placeholder="Driver details, condition..."
                      className="resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-kb-forest hover:bg-kb-deep text-white" disabled={logInventory.isPending}>
                    {logInventory.isPending ? 'Logging...' : 'Log Movement'}
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-kb-border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-kb-cream text-kb-muted uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Crop</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kb-border/50">
                    {inventory?.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-kb-muted">No stock available</td></tr>
                    )}
                    {inventory?.map(item => (
                      <tr key={item.crop_id} className="hover:bg-kb-cream/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {item.crop_name} <span className="text-xs text-kb-muted ml-2">{item.crop_name_np}</span>
                        </td>
                        <td className="px-4 py-3"><span className="text-[10px] bg-kb-cream text-kb-deep px-2 py-1 rounded font-bold">{item.category}</span></td>
                        <td className="px-4 py-3 text-right font-bold text-lg text-kb-forest">
                          {item.available_kg} <span className="text-xs text-kb-muted font-normal">KG</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}