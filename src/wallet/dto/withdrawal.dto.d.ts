import { WalletType } from '../schemas/wallet.schema';
export declare class WithdrawalDto {
    walletType: WalletType;
    amount: number;
    currency: 'naira' | 'usdt';
    withdrawalMethod?: string;
    accountDetails?: string;
    description?: string;
}
