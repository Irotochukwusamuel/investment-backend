import { WalletType } from '../schemas/wallet.schema';
export declare class CreateWalletDto {
    userId: string;
    type: WalletType;
    nairaBalance?: number;
    usdtBalance?: number;
}
