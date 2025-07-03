import { WalletType } from '../schemas/wallet.schema';
export declare class DepositDto {
    walletType: WalletType;
    amount: number;
    currency: 'naira' | 'usdt';
    paymentMethod?: string;
    paymentReference?: string;
    description?: string;
}
