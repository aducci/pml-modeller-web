'use client';
import Link from 'next/link';
import { PlatformHeader } from '@/components/PlatformHeader';
import { ProcessWorkspaceShell } from '@/components/ProcessWorkspaceShell';

const SAMPLE_PML = `@process L3 "Online Order Fulfillment" parent=vc-ecommerce version=1.0 status=approved

event order_placed    as "Order Placed"
event order_fulfilled as "Order Fulfilled"
event order_cancelled as "Order Cancelled"

app_registry {
    ecommerce_web "E-commerce Storefront"
    crm_system    "Customer CRM"
    twilio        "Twilio Notifications"
}

actor Customer
    task(user) place_order as "Place Order"
        app ecommerce_web

actor Store
    task(service) check_inventory as "Check Inventory"
        description "Real-time stock check across all warehouse locations."
        rule "Reserve stock for 15 minutes while payment is processed."
        app crm_system

    task(service) process_payment as "Process Payment"
        sla completion_time < 30s
        app crm_system

    task(manual) notify_unavailable as "Notify Customer"
        note "Offer alternatives or back-order option."
        app twilio

    decision(OR) stock_check as "Stock Available?":
        in_stock*  as "In Stock"    > process_payment
        out_of_stock as "Out of Stock" > notify_unavailable

actor Warehouse
    task(manual) pick_pack  as "Pick & Pack Order"
        kpi fulfilment_time < 2h
        app crm_system
    task(service) dispatch   as "Dispatch with Courier"
        rule "Same-day dispatch if confirmed before 2pm."
        app crm_system

decision fulfil as "Fulfil Order" 
    Fulfilled > dispatch
    Notdone > pick_pack

flow key
    order_placed > place_order > check_inventory > stock_check

process_payment > fulfil > dispatch > order_fulfilled
notify_unavailable > order_cancelled

---context---
description: "End-to-end order fulfillment from customer purchase to dispatch."
owners: [ecommerce-platform, warehouse-ops]

`;

export default function DemoPage() {
  return (
    <div className="h-screen flex flex-col page-enter">
      <PlatformHeader
        section="Interactive demo"
        badge="Preview"
        homeHref="/"
        rightSlot={<Link href="/auth/signin?from=demo" className="text-sm font-medium text-gray-600 hover:text-teal">Sign in to save work</Link>}
      />
      <div className="h-[calc(100vh-56px)] min-h-0">
        <ProcessWorkspaceShell initialPml={SAMPLE_PML} />
      </div>
    </div>
  );
}
