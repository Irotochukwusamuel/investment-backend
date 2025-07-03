import { CreateInvestmentDto } from './create-investment.dto';
import { InvestmentStatus, InvestmentType } from '../schemas/investment.schema';
declare const UpdateInvestmentDto_base: import("@nestjs/common").Type<Partial<CreateInvestmentDto>>;
export declare class UpdateInvestmentDto extends UpdateInvestmentDto_base {
    status?: InvestmentStatus;
    earnedAmount?: number;
    lastRoiUpdate?: Date;
    type?: InvestmentType;
    autoReinvest?: boolean;
    welcomeBonus?: number;
    referralBonus?: number;
    transactionId?: string;
    notes?: string;
}
export {};
