export declare class CreateInvestmentRequestDto {
    planId: string;
    amount: number;
    currency: 'naira' | 'usdt';
    autoReinvest?: boolean;
}
