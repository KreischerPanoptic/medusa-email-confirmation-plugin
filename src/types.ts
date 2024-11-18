export interface EmailConfirmationPluginOptions {
    /* max lifetime of the email confirmation token in days, empty for no limit */
    token_max_lifetime_days?: number;
    /* automatically initialize email confirmation through token on customer registration */
    autoinit_on_register: boolean;
  }

export type PluginOptions = EmailConfirmationPluginOptions