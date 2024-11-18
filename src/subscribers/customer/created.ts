import { 
    type SubscriberConfig, 
    type SubscriberArgs,
    CustomerService,
    Customer,
  } from "@medusajs/medusa"
import EmailConfirmationService from "src/services/email-confirmation";
  
  export default async function handleCustomerCreated({ 
    data, eventName, container, pluginOptions, 
  }: SubscriberArgs<Record<string, string>>) {
    const emailConfirmationService = container.resolve<EmailConfirmationService>("EmailConfirmationService")
    let customer = (data as any) as Customer
    if(customer) {
      if(customer.has_account && emailConfirmationService.options().autoinit_on_register) {
        const response = await emailConfirmationService.tokenRequest(customer.email, true)
      }
    }
  }
  
  export const config: SubscriberConfig = {
    event: CustomerService.Events.CREATED,
    context: {
      subscriberId: "customer-created-email-confirmation-handler",
    },
  }