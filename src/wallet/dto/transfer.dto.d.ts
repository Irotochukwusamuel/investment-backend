import { WalletType } from '../schemas/wallet.schema';
export declare class TransferDto {
    fromWallet: WalletType;
    toWallet: WalletType;
    amount: number;
    currency: 'naira' | 'usdt';
    description?: string;
}
