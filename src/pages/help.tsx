"use client";

import { CustomerLayout } from "@/components/CustomerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, TruckIcon, RefreshCw, DollarSign, Store, Shield, MessageCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      title: "Orders & Shipping",
      icon: Package,
      faqs: [
        {
          question: "How can I track my order?",
          answer: "You can track your order by logging into your account and visiting the Orders page. You'll find a tracking number and real-time status updates for each order. You'll also receive email notifications when your order ships and arrives.",
        },
        {
          question: "What are the shipping charges?",
          answer: "Shipping charges vary by seller, product weight, and delivery location. Most orders qualify for free shipping on purchases over $50. You'll see the exact shipping cost at checkout before completing your purchase.",
        },
        {
          question: "How long does delivery take?",
          answer: "Standard delivery takes 3-7 business days. Express shipping (1-2 days) is available for most products. Delivery times may vary based on your location and product availability. Check the product page for specific delivery estimates.",
        },
        {
          question: "Can I change my delivery address?",
          answer: "You can change your delivery address before the order ships. Go to your Orders page, find the order, and click 'Change Address'. Once shipped, contact customer support immediately for assistance.",
        },
      ],
    },
    {
      title: "Returns & Refunds",
      icon: RefreshCw,
      faqs: [
        {
          question: "What is the return policy?",
          answer: "Most products can be returned within 30 days of delivery in original condition. Some categories like electronics have a 14-day return window. Customized or personalized items are non-returnable. Visit our Returns page for full details.",
        },
        {
          question: "How do I initiate a return?",
          answer: "Log into your account, go to Orders, select the item you want to return, and click 'Request Return'. Choose your reason and preferred refund method. You'll receive a prepaid return shipping label via email within 24 hours.",
        },
        {
          question: "When will I receive my refund?",
          answer: "Refunds are processed within 3-5 business days after we receive your returned item. The amount will be credited to your original payment method. For wallet refunds, the amount is instant upon return approval.",
        },
        {
          question: "What if I received a damaged product?",
          answer: "We apologize for the inconvenience. Contact customer support immediately with photos of the damage. We'll arrange a free replacement or full refund, including return shipping costs.",
        },
      ],
    },
    {
      title: "Payments",
      icon: DollarSign,
      faqs: [
        {
          question: "What payment methods are accepted?",
          answer: "We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. Some sellers also offer Cash on Delivery (COD) in select regions.",
        },
        {
          question: "Is my payment information secure?",
          answer: "Yes, absolutely. We use industry-standard SSL encryption and PCI-DSS compliant payment gateways. Your payment information is never stored on our servers. All transactions are processed through secure third-party payment processors.",
        },
        {
          question: "Can I use multiple payment methods?",
          answer: "Currently, you can use one payment method per order. However, you can split payment between your wallet balance and a card. Gift cards and promotional credits are automatically applied at checkout.",
        },
        {
          question: "What if my payment fails?",
          answer: "Payment failures can occur due to insufficient funds, card limits, or bank security holds. Try again with a different payment method. If issues persist, contact your bank or our customer support for assistance.",
        },
      ],
    },
    {
      title: "Seller Support",
      icon: Store,
      faqs: [
        {
          question: "How do I become a seller?",
          answer: "Click 'Become a Seller' in the header, fill out the registration form with your business details, and submit required documents (business license, ID proof). Our team reviews applications within 24-48 hours.",
        },
        {
          question: "What are the seller fees?",
          answer: "We charge a commission of 5-15% per sale depending on product category. There are no monthly fees or listing fees. You only pay when you make a sale. Check our Seller Terms for detailed pricing.",
        },
        {
          question: "When do I receive payments?",
          answer: "Seller payments are processed weekly after the order is delivered and the return window expires. You can request withdrawals to your bank account, and funds typically arrive within 2-3 business days.",
        },
        {
          question: "Can I manage inventory across multiple warehouses?",
          answer: "Yes, our seller dashboard supports multi-warehouse inventory management. You can set different stock quantities for each location and manage fulfillment preferences based on buyer location.",
        },
      ],
    },
    {
      title: "Account & Security",
      icon: Shield,
      faqs: [
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. The link is valid for 1 hour. If you don't receive the email, check your spam folder.",
        },
        {
          question: "Can I change my email address?",
          answer: "Yes, go to Account Settings → Profile Information → Change Email. You'll need to verify the new email address. Your order history and wishlist will remain intact.",
        },
        {
          question: "How do I delete my account?",
          answer: "Go to Account Settings → Privacy & Security → Delete Account. Please note this action is irreversible. All your data, orders, reviews, and wishlist will be permanently deleted.",
        },
        {
          question: "Is two-factor authentication available?",
          answer: "Yes, we highly recommend enabling 2FA for added security. Go to Account Settings → Security → Enable Two-Factor Authentication. You can use SMS or authenticator app for verification.",
        },
      ],
    },
  ];

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-muted-foreground mb-8">
              Search our help center or browse categories below
            </p>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for help articles..."
                className="pl-12 pr-4 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="container py-16">
        <div className="space-y-12">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.title}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{category.title}</h2>
                </div>

                <Accordion type="single" collapsible className="space-y-2">
                  {category.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.title}-${index}`}
                      className="border rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>

        {/* Contact Support Card */}
        <Card className="mt-16 bg-gradient-to-br from-primary/5 to-accent/5 border-none">
          <CardContent className="pt-8">
            <div className="text-center max-w-2xl mx-auto">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
              <p className="text-muted-foreground mb-6">
                Our customer support team is here to assist you 24/7
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact Support
                  </Button>
                </Link>
                <Link href="/returns">
                  <Button size="lg" variant="outline">
                    View Return Policy
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}