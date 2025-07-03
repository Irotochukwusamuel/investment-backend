"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const wallet_schema_1 = require("./schemas/wallet.schema");
let WalletService = class WalletService {
    walletModel;
    constructor(walletModel) {
        this.walletModel = walletModel;
    }
    async create(createWalletDto) {
        const wallet = new this.walletModel({
            ...createWalletDto,
            userId: new mongoose_2.Types.ObjectId(createWalletDto.userId),
        });
        return wallet.save();
    }
    async findAll(query = {}) {
        const { userId, type, status, limit = 50, page = 1 } = query;
        const filter = {};
        if (userId)
            filter.userId = new mongoose_2.Types.ObjectId(userId);
        if (type)
            filter.type = type;
        if (status)
            filter.status = status;
        const skip = (page - 1) * limit;
        return this.walletModel
            .find(filter)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
    async findOne(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid wallet ID');
        }
        const wallet = await this.walletModel
            .findById(id)
            .populate('userId', 'firstName lastName email')
            .exec();
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async findByUserId(userId) {
        return this.walletModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .populate('userId', 'firstName lastName email')
            .sort({ type: 1 })
            .exec();
    }
    async findByUserAndType(userId, type) {
        const wallet = await this.walletModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId), type })
            .populate('userId', 'firstName lastName email')
            .exec();
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async update(id, updateWalletDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid wallet ID');
        }
        const wallet = await this.walletModel
            .findByIdAndUpdate(id, updateWalletDto, { new: true, runValidators: true })
            .exec();
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid wallet ID');
        }
        const wallet = await this.walletModel.findByIdAndDelete(id).exec();
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
    }
    async deposit(userId, depositDto) {
        const { walletType, amount, currency, description } = depositDto;
        let wallet = await this.walletModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            type: walletType,
        });
        if (!wallet) {
            wallet = await this.create({
                userId,
                type: walletType,
                nairaBalance: currency === 'naira' ? amount : 0,
                usdtBalance: currency === 'usdt' ? amount : 0,
            });
        }
        else {
            if (currency === 'naira') {
                wallet.nairaBalance += amount;
                wallet.totalDeposits += amount;
            }
            else {
                wallet.usdtBalance += amount;
                wallet.totalDeposits += amount;
            }
            if (description && description.toLowerCase().includes('roi')) {
                wallet.totalEarnings += amount;
            }
            wallet.lastTransactionDate = new Date();
            await wallet.save();
        }
        return wallet;
    }
    async withdraw(userId, withdrawalDto) {
        const { walletType, amount, currency, description } = withdrawalDto;
        const wallet = await this.findByUserAndType(userId, walletType);
        if (currency === 'naira' && wallet.nairaBalance < amount) {
            throw new common_1.BadRequestException('Insufficient naira balance');
        }
        if (currency === 'usdt' && wallet.usdtBalance < amount) {
            throw new common_1.BadRequestException('Insufficient USDT balance');
        }
        if (currency === 'naira') {
            wallet.nairaBalance -= amount;
            wallet.totalWithdrawals += amount;
        }
        else {
            wallet.usdtBalance -= amount;
            wallet.totalWithdrawals += amount;
        }
        if (description && description.toLowerCase().includes('investment')) {
            wallet.totalInvestments += amount;
        }
        wallet.lastTransactionDate = new Date();
        await wallet.save();
        return wallet;
    }
    async transfer(userId, transferDto) {
        const { fromWallet, toWallet, amount, currency } = transferDto;
        if (fromWallet === toWallet) {
            throw new common_1.BadRequestException('Cannot transfer to the same wallet');
        }
        const sourceWallet = await this.findByUserAndType(userId, fromWallet);
        const destinationWallet = await this.findByUserAndType(userId, toWallet);
        if (currency === 'naira' && sourceWallet.nairaBalance < amount) {
            throw new common_1.BadRequestException('Insufficient naira balance');
        }
        if (currency === 'usdt' && sourceWallet.usdtBalance < amount) {
            throw new common_1.BadRequestException('Insufficient USDT balance');
        }
        if (currency === 'naira') {
            sourceWallet.nairaBalance -= amount;
        }
        else {
            sourceWallet.usdtBalance -= amount;
        }
        sourceWallet.lastTransactionDate = new Date();
        await sourceWallet.save();
        if (currency === 'naira') {
            destinationWallet.nairaBalance += amount;
        }
        else {
            destinationWallet.usdtBalance += amount;
        }
        destinationWallet.lastTransactionDate = new Date();
        await destinationWallet.save();
        return { fromWallet: sourceWallet, toWallet: destinationWallet };
    }
    async getWalletStats(userId) {
        const filter = {};
        if (userId) {
            filter.userId = new mongoose_2.Types.ObjectId(userId);
        }
        const stats = await this.walletModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalWallets: { $sum: 1 },
                    totalNairaBalance: { $sum: '$nairaBalance' },
                    totalUsdtBalance: { $sum: '$usdtBalance' },
                    totalDeposits: { $sum: '$totalDeposits' },
                    totalWithdrawals: { $sum: '$totalWithdrawals' },
                    totalInvestments: { $sum: '$totalInvestments' },
                    totalEarnings: { $sum: '$totalEarnings' },
                    totalBonuses: { $sum: '$totalBonuses' },
                    totalReferralEarnings: { $sum: '$totalReferralEarnings' },
                }
            }
        ]);
        return stats[0] || {
            totalWallets: 0,
            totalNairaBalance: 0,
            totalUsdtBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalInvestments: 0,
            totalEarnings: 0,
            totalBonuses: 0,
            totalReferralEarnings: 0,
        };
    }
    async checkBalance(userId, amount, currency, walletType = wallet_schema_1.WalletType.MAIN) {
        try {
            const wallet = await this.findByUserAndType(userId, walletType);
            if (currency === 'naira') {
                return wallet.nairaBalance >= amount;
            }
            else {
                return wallet.usdtBalance >= amount;
            }
        }
        catch (error) {
            return false;
        }
    }
    async getBalance(userId, currency, walletType = wallet_schema_1.WalletType.MAIN) {
        try {
            const wallet = await this.findByUserAndType(userId, walletType);
            if (currency === 'naira') {
                return wallet.nairaBalance;
            }
            else {
                return wallet.usdtBalance;
            }
        }
        catch (error) {
            return 0;
        }
    }
    async createDefaultWallets(userId) {
        const wallets = [];
        const mainWallet = await this.create({
            userId,
            type: wallet_schema_1.WalletType.MAIN,
            nairaBalance: 0,
            usdtBalance: 0,
        });
        wallets.push(mainWallet);
        const profitWallet = await this.create({
            userId,
            type: wallet_schema_1.WalletType.PROFIT,
            nairaBalance: 0,
            usdtBalance: 0,
        });
        wallets.push(profitWallet);
        const bonusWallet = await this.create({
            userId,
            type: wallet_schema_1.WalletType.BONUS,
            nairaBalance: 0,
            usdtBalance: 0,
        });
        wallets.push(bonusWallet);
        return wallets;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(wallet_schema_1.Wallet.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], WalletService);
//# sourceMappingURL=wallet.service.js.map