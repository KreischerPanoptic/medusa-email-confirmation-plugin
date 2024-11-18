import {
    Customer,
    EventBusService,
    Logger,
    TransactionBaseService,
  } from "@medusajs/medusa";
  import CustomerRepository from "@medusajs/medusa/dist/repositories/customer";
  import { Lifetime } from "awilix";
import moment from "moment";
import { EmailConfirmationPluginOptions, PluginOptions } from "src/types";
import { randomString } from "src/utils";
import { APIResponse, ConfirmationStatus, StatusResponseViewModel } from "src/views";

  export default class EmailConfirmationService extends TransactionBaseService {
    static LIFE_TIME = Lifetime.SCOPED;
    protected customerRepository: typeof CustomerRepository;
    protected eventBusService: EventBusService | undefined;
    logger: Logger;
    options_: PluginOptions;

    constructor(container, options: PluginOptions) {
        super(container);
        this.customerRepository = container.customerRepository;
    
        try {
          this.eventBusService = container?.eventBusService;
        } catch (e) {
          this.eventBusService = undefined;
        }
        let op = options as EmailConfirmationPluginOptions;
        this.logger = container.logger;
        this.options_ = op;
    }

    options(): PluginOptions {
        return this.options_;
    }

    private async generateToken(customer: Customer): Promise<Customer> {
        let updateMetadata = customer.metadata;
        const token = randomString(64);
        const generatedAt = new Date();

        updateMetadata.email_confirmation_token = token;
        updateMetadata.email_confirmation_token_generated_at = generatedAt.toISOString();
        
        if(!customer.metadata.email_confirmation_requested_at) {
            updateMetadata.email_confirmation_requested_at = new Date().toISOString();
        }
        const projectedExpirationDate = moment(generatedAt).add(this.options_.token_max_lifetime_days, 'days')
        updateMetadata.email_confirmation_token_expires_at = projectedExpirationDate.startOf('day').toISOString()
        
        await this.customerRepository.update({id: customer.id}, {metadata: updateMetadata})

        return await this.customerRepository.findOneBy({id: customer.id})
    }

    private async confirmEmail(customer: Customer): Promise<Customer> {
        let updateMetadata = customer.metadata;
        
        updateMetadata.email_confirmation_confirmed_at = new Date().toISOString();
        await this.customerRepository.update({id: customer.id}, {metadata: updateMetadata})

        return await this.customerRepository.findOneBy({id: customer.id})
    }

    async tokenRequest(email: string, autogenerate: boolean = false): Promise<APIResponse<never>> {
        const customer = await this.customerRepository.findOneBy({email})
        const response = new APIResponse<never>()
        if(!customer) {
            response.success = false;
            response.code = 'email_not_found';
            response.error = `Registered customer with email - ${email} not found.`
            return response
        }
        else {
            if(!customer.has_account) {
                response.success = false;
                response.code = 'email_not_found';
                response.error = `Registered customer with email - ${email} not found. Customer with email ${email} - not registered, but exists.`
                return response
            }
        }

        if(autogenerate && !this.options_.autoinit_on_register) {
            response.success = false;
            response.code = 'token_not_created'
            response.error = `Autoinitialization - forbidden.`
            return response
        }

        if(customer.metadata.email_confirmation_confirmed_at) {
            if(moment(`${customer.metadata.email_confirmation_confirmed_at}`, moment.ISO_8601, true).isValid()) {
                response.success = false;
                response.code = 'email_already_confirmed';
                response.error = `Registered customer with email - ${email} already confirmed his email at: ${moment(`${customer.metadata.email_confirmation_confirmed_at}`).toLocaleString()}.`
                return response
            }
        }

        if(customer.metadata.email_confirmation_token) {
            if(this.options_.token_max_lifetime_days) {
                if(customer.metadata.email_confirmation_token_expires_at) {
                    if(moment(`${customer.metadata.email_confirmation_token_expires_at}`, moment.ISO_8601, true).isValid()) {
                        const tokenExpires = moment(`${customer.metadata.email_confirmation_token_expires_at}`, moment.ISO_8601, true)
                        //const projectedExpirationDate = moment(new Date()).add(this.options_.token_max_lifetime_days, 'days')
                        if(tokenExpires <= moment(new Date())) {
                            const updated = await this.generateToken(customer);
                            if(updated) {
                                this.eventBusService.emit('customer.email_confirm', {customer, token: updated.metadata.email_confirmation_token, canExpire: this.options_.token_max_lifetime_days ? true : false, expires: updated.metadata.email_confirmation_token_expires_at})
                                response.success = true;
                                return response;
                            }
                        }
                    }
                }
            }
            else {
                this.eventBusService.emit('customer.email_confirm', {customer, token: customer.metadata.email_confirmation_token, canExpire: this.options_.token_max_lifetime_days ? true : false, expires: customer.metadata.email_confirmation_token_expires_at})
                response.success = true;
                return response;
            }
        }
        else {
            const updated = await this.generateToken(customer);
            if(updated) {
                this.eventBusService.emit('customer.email_confirm', {customer, token: updated.metadata.email_confirmation_token, canExpire: this.options_.token_max_lifetime_days ? true : false, expires: updated.metadata.email_confirmation_token_expires_at})
                response.success = true;
                return response;
            }
        }
    }

    async status(email: string): Promise<APIResponse<StatusResponseViewModel>> {
        const customer = await this.customerRepository.findOneBy({email})
        const response = new APIResponse<StatusResponseViewModel>()
        if(!customer) {
            response.success = false;
            response.code = 'email_not_found';
            response.error = `Registered customer with email - ${email} not found.`
            return response
        }

        if(customer.metadata.email_confirmation_confirmed_at) {
            if(moment(`${customer.metadata.email_confirmation_confirmed_at}`, moment.ISO_8601, true).isValid()) {
                response.success = true;
                response.data = new StatusResponseViewModel();
                response.data.status = 'confirmed';
                return response
            }
        }
        else {
            if(customer.metadata.email_confirmation_token) {
                if(this.options_.token_max_lifetime_days) {
                    if(customer.metadata.email_confirmation_token_expires_at) {
                        if(moment(`${customer.metadata.email_confirmation_token_expires_at}`, moment.ISO_8601, true).isValid()) {
                            const tokenExpires = moment(`${customer.metadata.email_confirmation_token_expires_at}`, moment.ISO_8601, true)
                            //const projectedExpirationDate = moment(new Date()).add(this.options_.token_max_lifetime_days, 'days')
                            if(tokenExpires <= moment(new Date())) {
                                response.success = true;
                                response.data = new StatusResponseViewModel();
                                response.data.status = 'expired';
                                return response
                            }
                            else {
                                response.success = true;
                                response.data = new StatusResponseViewModel();
                                response.data.status = 'awaiting';
                                return response
                            }
                        }
                        else {
                            response.success = true;
                            response.data = new StatusResponseViewModel();
                            response.data.status = 'uninitialized';
                            return response
                        }
                    }
                    else {
                        response.success = true;
                        response.data = new StatusResponseViewModel();
                        response.data.status = 'uninitialized';
                        return response
                    }
                }
                else {
                    response.success = true;
                    response.data = new StatusResponseViewModel();
                    response.data.status = 'uninitialized';
                    return response
                }
            }
            else {
                response.success = true;
                response.data = new StatusResponseViewModel();
                response.data.status = 'uninitialized';
                return response
            }
        }
    }

    async confirm(email: string, token: string): Promise<APIResponse<never>> {
        const customer = await this.customerRepository.findOneBy({email})
        const response = new APIResponse<never>()

        if(!token || token.length <= 0) {
            response.success = false;
            response.code = 'empty_token'
            response.error = `Provided confirmation token - is empty!`
            return response
        }

        if(!customer) {
            response.success = false;
            response.code = 'email_not_found';
            response.error = `Registered customer with email - ${email} not found.`
            return response
        }

        if(customer.metadata.email_confirmation_confirmed_at) {
            if(moment(`${customer.metadata.email_confirmation_confirmed_at}`, moment.ISO_8601, true).isValid()) {
                response.success = false;
                response.code = 'email_already_confirmed';
                response.error = `Registered customer with email - ${email} already confirmed his email at: ${moment(`${customer.metadata.email_confirmation_confirmed_at}`).toLocaleString()}.`
                return response
            }
        }

        if(customer.metadata.email_confirmation_token) {
            if(this.options_.token_max_lifetime_days) {
                if(customer.metadata.email_confirmation_token_expires_at) {
                    if(moment(`${customer.metadata.email_confirmation_token_expires_at}`, moment.ISO_8601, true).isValid()) {
                        const tokenExpires = moment(`${customer.metadata.email_confirmation_token_expires_at}`, moment.ISO_8601, true)
                        //const projectedExpirationDate = moment(new Date()).add(this.options_.token_max_lifetime_days, 'days')
                        if(tokenExpires <= moment(new Date())) {
                            response.success = false;
                            response.code = 'token_expired'
                            response.error = `Token associated with email ${email} - expired! Try regenerating token.`
                            return response
                        }
                        else {
                            if(customer.metadata.email_confirmation_token === token) {
                                const updated = await this.confirmEmail(customer);
                                if(updated) {
                                    response.success = true;
                                    return response
                                }
                            }
                            else {
                                response.success = false;
                                response.code = 'token_not_found'
                                response.error = `Token associated with email ${email} - not matches the provided token! Confirmation aborted.`
                                return response
                            }
                        }
                    }
                }
            }
            else {
                this.eventBusService.emit('customer.email_confirm', {customer, token: customer.metadata.email_confirmation_token, canExpire: this.options_.token_max_lifetime_days ? true : false, expires: customer.metadata.email_confirmation_token_expires_at})
                response.success = true;
                return response;
            }
        }
        else {
            response.success = false;
            response.code = 'token_not_created'
            response.error = `Token associated with email ${email} - not found. Perhaps, email confirmation process wasn't initialized!`
            return response
        }
    }
  }