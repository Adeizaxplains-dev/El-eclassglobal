import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { StoreLayout } from '../components/layout/StoreLayout.jsx';
import { AdminLayout } from '../components/layout/AdminLayout.jsx';

import { Home } from '../pages/store/Home.jsx';
import { Shop } from '../pages/store/Shop.jsx';
import { ProductDetail } from '../pages/store/ProductDetail.jsx';
import { Cart } from '../pages/store/Cart.jsx';
import { Checkout } from '../pages/store/Checkout.jsx';
import { OrderDetail } from '../pages/store/OrderDetail.jsx';
import { About } from '../pages/store/About.jsx';
import { Contact } from '../pages/store/Contact.jsx';
import { Search } from '../pages/store/Search.jsx';
import { NotFound } from '../pages/store/NotFound.jsx';

import { Login } from '../pages/admin/Login.jsx';
import { Dashboard } from '../pages/admin/Dashboard.jsx';
import { Products } from '../pages/admin/Products.jsx';
import { ProductForm } from '../pages/admin/ProductForm.jsx';
import { Categories } from '../pages/admin/Categories.jsx';
import { Orders } from '../pages/admin/Orders.jsx';
import { OrderDetail as AdminOrderDetail } from '../pages/admin/OrderDetail.jsx';
import { Customers } from '../pages/admin/Customers.jsx';
import { CustomerDetail } from '../pages/admin/CustomerDetail.jsx';
import { Analytics } from '../pages/admin/Analytics.jsx';
import { Settings } from '../pages/admin/Settings.jsx';
import { Campaigns } from '../pages/admin/Campaigns.jsx';
import { Automations } from '../pages/admin/Automations.jsx';
import { AutomationConfig } from '../pages/admin/AutomationConfig.jsx';
import { Conversations } from '../pages/admin/Conversations.jsx';
import Team from '../pages/admin/Team.jsx';

export function AppRoutes() {
  return (
    <Routes>
      {/* Storefront */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderDetail />} />
        <Route path="/order/:id" element={<OrderDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/search" element={<Search />} />
      </Route>

      {/* Admin login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />

        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />

        <Route path="categories" element={<Categories />} />

        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />

        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="automations" element={<Automations />} />
        <Route path="automations/config" element={<AutomationConfig />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="team" element={<Team />} />
        <Route path="campaigns" element={<Campaigns />} />  
        <Route path="analytics" element={<Analytics />} />

        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}