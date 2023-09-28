import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { LoggerService } from '../common';
import { env } from '../config';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
  @Inject() private readonly logger: LoggerService;

  private stripe = new Stripe(env.stripe_secret_key, {
    apiVersion: '2023-08-16',
    maxNetworkRetries: 3,
    timeout: 1000,
  });

  getEvent(payload: any, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.stripe_signingkey,
      );
    } catch (err: any) {
      this.logger.error(`Unable to contruct webhook event, ${err}`);
      throw new BadRequestException(
        `Unable to contruct webhook event, ${err.message}`,
      );
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.getEvent(payload, signature);
    switch (event.type) {
      case 'checkout.session.completed':
        console.log("Checkout Session Completed")
    }
  }
}
