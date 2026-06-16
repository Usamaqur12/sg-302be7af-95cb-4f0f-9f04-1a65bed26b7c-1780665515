import { Resend } from "resend";
import {
  createEmailDeliveryLog,
  emailErrorMessage,
  getEmailDeliveryLog,
  updateEmailDeliveryLog,
  type EmailDeliveryLog,
} from "@/lib/server/email-delivery";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_MAX_ATTEMPTS = Number(process.env.EMAIL_MAX_ATTEMPTS || 3);
const EMAIL_RETRY_BASE_DELAY_MS = Number(process.env.EMAIL_RETRY_BASE_DELAY_MS || 500);

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendEmailInput = {
  emailType: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
  existingLog?: EmailDeliveryLog;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function providerMessageId(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const data = "data" in result ? (result as { data?: unknown }).data : result;
  if (!data || typeof data !== "object" || !("id" in data)) return null;
  const id = (data as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

function providerError(result: unknown) {
  if (!result || typeof result !== "object" || !("error" in result)) return null;
  return (result as { error?: unknown }).error ?? null;
}

async function sendTransactionalEmail(input: SendEmailInput) {
  const log = input.existingLog ?? await createEmailDeliveryLog({
    emailType: input.emailType,
    recipient: input.to,
    subject: input.subject,
    fromAddress: input.from,
    htmlBody: input.html,
    maxAttempts: EMAIL_MAX_ATTEMPTS,
    metadata: input.metadata,
  });

  if (!isEmailConfigured() || !resend) {
    await updateEmailDeliveryLog(log.id, {
      status: "skipped",
      last_error: "RESEND_API_KEY is not configured",
      next_retry_at: null,
    });
    return;
  }

  let lastError: unknown = null;
  const startAttempt = Math.max(0, log.attempt_count);

  for (let attempt = startAttempt + 1; attempt <= log.max_attempts; attempt += 1) {
    await updateEmailDeliveryLog(log.id, {
      status: "sending",
      attempt_count: attempt,
      last_error: null,
      next_retry_at: null,
    });

    try {
      const result = await resend.emails.send({
        from: input.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      const error = providerError(result);
      if (error) throw error;

      await updateEmailDeliveryLog(log.id, {
        status: "sent",
        provider_message_id: providerMessageId(result),
        sent_at: new Date().toISOString(),
        last_error: null,
        next_retry_at: null,
      });
      return;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < log.max_attempts;
      await updateEmailDeliveryLog(log.id, {
        status: canRetry ? "queued" : "failed",
        last_error: emailErrorMessage(error),
        next_retry_at: canRetry ? new Date(Date.now() + EMAIL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)).toISOString() : null,
      });

      if (canRetry) {
        await wait(EMAIL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(emailErrorMessage(lastError));
}

export async function retryEmailDelivery(logId: string) {
  const log = await getEmailDeliveryLog(logId);
  if (!log) throw new Error("Email delivery log not found");
  if (log.status === "sent") return log;

  await updateEmailDeliveryLog(log.id, {
    status: "queued",
    attempt_count: 0,
    last_error: null,
    next_retry_at: null,
  });

  await sendTransactionalEmail({
    emailType: log.email_type,
    from: log.from_address,
    to: log.recipient,
    subject: log.subject,
    html: log.html_body,
    metadata: log.metadata ?? undefined,
    existingLog: { ...log, attempt_count: 0, status: "queued", last_error: null, next_retry_at: null },
  });

  return getEmailDeliveryLog(log.id);
}

export const emailService = {
  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderTotal: number;
    orderItems: Array<{
      title: string;
      quantity: number;
      price: number;
    }>;
    orderDate: string;
  }) {
    try {
      const { to, customerName, orderNumber, orderTotal, orderItems, orderDate } = data;

      await sendTransactionalEmail({
        emailType: "order_confirmation",
        from: "Marketplace <orders@yourdomain.com>",
        to,
        subject: `Order Confirmation - ${orderNumber}`,
        metadata: { orderNumber },
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #1a1f2e; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1f2e; color: white; padding: 30px; text-align: center; }
                .content { background: #fefdfb; padding: 30px; }
                .order-details { background: white; border: 1px solid #e5e3df; padding: 20px; margin: 20px 0; }
                .item { border-bottom: 1px solid #e5e3df; padding: 15px 0; }
                .item:last-child { border-bottom: none; }
                .total { font-size: 24px; font-weight: bold; color: #d65a31; margin-top: 20px; }
                .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                .button { display: inline-block; background: #d65a31; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Order Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Hi ${customerName},</p>
                  <p>Thank you for your order. We've received your order and are processing it now.</p>
                  
                  <div class="order-details">
                    <h2>Order #${orderNumber}</h2>
                    <p><strong>Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
                    
                    <h3>Order Items:</h3>
                    ${orderItems.map(item => `
                      <div class="item">
                        <strong>${item.title}</strong><br>
                        Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}
                      </div>
                    `).join('')}
                    
                    <div class="total">
                      Total: $${orderTotal.toFixed(2)}
                    </div>
                  </div>
                  
                  <center>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}" class="button">
                      Track Your Order
                    </a>
                  </center>
                  
                  <p>You can track your order status and view details anytime in your account dashboard.</p>
                </div>
                <div class="footer">
                  <p>Questions? Contact us at support@yourdomain.com</p>
                  <p>&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      throw error;
    }
  },

  /**
   * Send seller approval notification
   */
  async sendSellerApproval(data: {
    to: string;
    businessName: string;
    status: "approved" | "rejected";
    reason?: string;
  }) {
    try {
      const { to, businessName, status, reason } = data;

      if (status === "approved") {
        await sendTransactionalEmail({
          emailType: "seller_approval",
          from: "Marketplace <admin@yourdomain.com>",
          to,
          subject: "🎉 Your Seller Account Has Been Approved!",
          metadata: { status, businessName },
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #1a1f2e; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #16a34a; color: white; padding: 30px; text-align: center; }
                  .content { background: #fefdfb; padding: 30px; }
                  .button { display: inline-block; background: #d65a31; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                  .checklist { background: white; border: 1px solid #e5e3df; padding: 20px; margin: 20px 0; }
                  .checklist li { margin: 10px 0; }
                  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Congratulations!</h1>
                  </div>
                  <div class="content">
                    <h2>Welcome to the Marketplace, ${businessName}!</h2>
                    <p>Your seller account has been approved and you can now start selling on our platform.</p>
                    
                    <div class="checklist">
                      <h3>Next Steps:</h3>
                      <ol>
                        <li>Log in to your seller dashboard</li>
                        <li>Add your first products</li>
                        <li>Set up your store profile</li>
                        <li>Configure shipping settings</li>
                        <li>Start receiving orders!</li>
                      </ol>
                    </div>
                    
                    <center>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/seller" class="button">
                        Go to Seller Dashboard
                      </a>
                    </center>
                    
                    <p>If you have any questions, our support team is here to help you succeed.</p>
                  </div>
                  <div class="footer">
                    <p>Need help? Email us at seller-support@yourdomain.com</p>
                    <p>&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await sendTransactionalEmail({
          emailType: "seller_rejection",
          from: "Marketplace <admin@yourdomain.com>",
          to,
          subject: "Update on Your Seller Application",
          metadata: { status, businessName },
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #1a1f2e; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
                  .content { background: #fefdfb; padding: 30px; }
                  .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Application Update</h1>
                  </div>
                  <div class="content">
                    <h2>Hi ${businessName},</h2>
                    <p>Thank you for your interest in selling on our marketplace. Unfortunately, we are unable to approve your seller application at this time.</p>
                    
                    ${reason ? `
                      <div class="reason-box">
                        <strong>Reason:</strong><br>
                        ${reason}
                      </div>
                    ` : ''}
                    
                    <p>If you have any questions or would like to address the issues mentioned, please contact our seller support team.</p>
                  </div>
                  <div class="footer">
                    <p>Contact us at seller-support@yourdomain.com</p>
                    <p>&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      }
    } catch (error) {
      console.error("Failed to send seller approval email:", error);
      throw error;
    }
  },

  /**
   * Send payout notification to seller
   */
  async sendPayoutNotification(data: {
    to: string;
    businessName: string;
    amount: number;
    status: "completed" | "rejected";
    requestDate: string;
    processedDate: string;
    adminNotes?: string;
  }) {
    try {
      const { to, businessName, amount, status, requestDate, processedDate, adminNotes } = data;

      if (status === "completed") {
        await sendTransactionalEmail({
          emailType: "payout_completed",
          from: "Marketplace <payouts@yourdomain.com>",
          to,
          subject: `Payout Completed - $${amount.toFixed(2)}`,
          metadata: { status, amount },
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #1a1f2e; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #16a34a; color: white; padding: 30px; text-align: center; }
                  .content { background: #fefdfb; padding: 30px; }
                  .payout-details { background: white; border: 1px solid #e5e3df; padding: 20px; margin: 20px 0; }
                  .amount { font-size: 32px; font-weight: bold; color: #16a34a; margin: 20px 0; }
                  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Payout Completed</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${businessName},</p>
                    <p>Great news! Your withdrawal request has been processed and the funds are on their way to your account.</p>
                    
                    <div class="payout-details">
                      <div class="amount">$${amount.toFixed(2)}</div>
                      <p><strong>Requested:</strong> ${new Date(requestDate).toLocaleDateString()}</p>
                      <p><strong>Processed:</strong> ${new Date(processedDate).toLocaleDateString()}</p>
                      ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ''}
                    </div>
                    
                    <p>The funds should appear in your registered bank account within 3-5 business days, depending on your bank's processing time.</p>
                  </div>
                  <div class="footer">
                    <p>Questions about your payout? Contact seller-support@yourdomain.com</p>
                    <p>&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } else {
        await sendTransactionalEmail({
          emailType: "payout_rejected",
          from: "Marketplace <payouts@yourdomain.com>",
          to,
          subject: "Payout Request Update",
          metadata: { status, amount },
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #1a1f2e; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
                  .content { background: #fefdfb; padding: 30px; }
                  .payout-details { background: white; border: 1px solid #e5e3df; padding: 20px; margin: 20px 0; }
                  .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Payout Request Update</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${businessName},</p>
                    <p>We're writing to inform you that your withdrawal request has been reviewed and cannot be processed at this time.</p>
                    
                    <div class="payout-details">
                      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                      <p><strong>Requested:</strong> ${new Date(requestDate).toLocaleDateString()}</p>
                      <p><strong>Reviewed:</strong> ${new Date(processedDate).toLocaleDateString()}</p>
                    </div>
                    
                    ${adminNotes ? `
                      <div class="reason-box">
                        <strong>Reason:</strong><br>
                        ${adminNotes}
                      </div>
                    ` : ''}
                    
                    <p>If you have questions or need clarification, please contact our support team.</p>
                  </div>
                  <div class="footer">
                    <p>Contact us at seller-support@yourdomain.com</p>
                    <p>&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      }
    } catch (error) {
      console.error("Failed to send payout notification email:", error);
      throw error;
    }
  },

  /**
   * Send new order notification to seller
   */
  async sendNewOrderToSeller(data: {
    to: string;
    businessName: string;
    orderNumber: string;
    customerName: string;
    orderTotal: number;
    orderItems: Array<{
      title: string;
      quantity: number;
      price: number;
    }>;
  }) {
    try {
      const { to, businessName, orderNumber, customerName, orderTotal, orderItems } = data;

      await sendTransactionalEmail({
        emailType: "seller_new_order",
        from: "Marketplace <orders@yourdomain.com>",
        to,
        subject: `New Order Received - ${orderNumber}`,
        metadata: { orderNumber },
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #1a1f2e; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #d65a31; color: white; padding: 30px; text-align: center; }
                .content { background: #fefdfb; padding: 30px; }
                .order-details { background: white; border: 1px solid #e5e3df; padding: 20px; margin: 20px 0; }
                .item { border-bottom: 1px solid #e5e3df; padding: 15px 0; }
                .item:last-child { border-bottom: none; }
                .button { display: inline-block; background: #d65a31; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🛍️ New Order!</h1>
                </div>
                <div class="content">
                  <p>Hi ${businessName},</p>
                  <p>You have a new order to fulfill!</p>
                  
                  <div class="order-details">
                    <h2>Order #${orderNumber}</h2>
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Total:</strong> $${orderTotal.toFixed(2)}</p>
                    
                    <h3>Items:</h3>
                    ${orderItems.map(item => `
                      <div class="item">
                        <strong>${item.title}</strong><br>
                        Quantity: ${item.quantity} × $${item.price.toFixed(2)}
                      </div>
                    `).join('')}
                  </div>
                  
                  <center>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/seller/orders" class="button">
                      View Order Details
                    </a>
                  </center>
                  
                  <p>Please process this order as soon as possible to maintain a high customer satisfaction rating.</p>
                </div>
                <div class="footer">
                  <p>Need help? Contact seller-support@yourdomain.com</p>
                  <p>&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error("Failed to send new order notification:", error);
      throw error;
    }
  },
};
