import { Injectable } from '@angular/core';
import { IntentHandler } from './base-intent-handler';
import { IntentContext, HandlerResult } from '../../models/intent-context.types';
import { ResponseBuilder } from '../../response-builder';
import { INTENTS } from '../../models/intent-config';
import { AppViewService } from '../../../app-view.service';

/**
 * Handles RECENT_ACTIVITY_CARD intent - displays recent transactions UI component
 */
@Injectable()
export class RecentActivityIntentHandler implements IntentHandler {
    constructor(private appViewService: AppViewService) {}

    handle(context: IntentContext): HandlerResult {
        const config = this.determineConfig(context);
        return ResponseBuilder.create()
            .uiElement(INTENTS.RECENT_ACTIVITY_CARD, config)
            .build();
    }

    private determineConfig(context: IntentContext): any {
        const lowerText = context.lowerText || '';
        const config: any = {
            title: 'Recent Transactions',
            subtitle: 'Latest transactions',
            period: 'monthly'
        };

        if (lowerText.includes('yesterday')) {
            config.period = 'yesterday';
            config.title = "Yesterday's Transactions";
            config.subtitle = 'Transactions for yesterday';
        } else if (lowerText.includes('today') || lowerText.includes(' day')) {
            config.period = 'daily';
            config.title = "Today's Transactions";
            config.subtitle = 'Transactions for today';
        } else if (lowerText.includes('week')) {
            config.period = 'weekly';
            config.title = 'Weekly Transactions';
            config.subtitle = 'Transactions for this week';
        } else if (lowerText.includes('month')) {
            if (lowerText.includes('last month')) {
                config.period = 'last-month';
                config.title = "Last Month's Transactions";
                config.subtitle = 'Transactions for last month';
            } else {
                config.period = 'monthly';
                config.title = 'Monthly Transactions';
                config.subtitle = 'Transactions for this month';
            }
        } else if (lowerText.includes('year')) {
            config.period = 'yearly';
            config.title = 'Yearly Transactions';
            config.subtitle = 'Transactions for this year';
        } else {
            // Fallback to AppViewService view settings if mapped
            const viewLabel = this.appViewService.getViewLabel().toLowerCase();
            if (viewLabel === 'day') {
                config.period = 'daily';
                config.title = "Today's Transactions";
                config.subtitle = 'Transactions for today';
            } else if (viewLabel === 'week') {
                config.period = 'weekly';
                config.title = 'Weekly Transactions';
                config.subtitle = 'Transactions for this week';
            } else if (viewLabel === 'year') {
                config.period = 'yearly';
                config.title = 'Yearly Transactions';
                config.subtitle = 'Transactions for this year';
            } else {
                config.period = 'monthly';
                config.title = 'Recent Transactions';
                config.subtitle = 'Latest transactions';
            }
        }

        return config;
    }
}
