import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type {
  FundWalletInput,
  DebitWalletInput,
  ListTransactionsQuery,
  ListWalletsQuery,
} from "../validators/walletValidator";

type TxClient = Prisma.TransactionClient;


class WalletService {
  async getOrCreateForUser(userId: number) {
    const existing = await prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;

    return prisma.wallet.create({ data: { userId } });
  }

  async getById(id: number, userId: number, role: string | undefined) {
    const wallet = await prisma.wallet.findUnique({ where: { id } });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found.");
    }

    if (role !== "ADMIN" && wallet.userId !== userId) {
      throw ApiError.forbidden("You do not have permission to view this wallet.");
    }

    return wallet;
  }

  async listAll(query: ListWalletsQuery) {
    const { page, limit } = query;

    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.wallet.count(),
    ]);

    return {
      wallets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async fund(userId: number, data: FundWalletInput) {
    const wallet = await this.getOrCreateForUser(userId);
    await this.assertReferenceUnused(data.reference);

    return prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: data.amount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          type: "CREDIT",
          amount: data.amount,
          reference: data.reference,
          description: data.description,
          walletId: wallet.id,
        },
      });

      return { wallet: updated, transaction };
    });
  }

  async debit(userId: number, data: DebitWalletInput) {
    const wallet = await this.getOrCreateForUser(userId);
    await this.assertReferenceUnused(data.reference);

    if (Number(wallet.balance) < data.amount) {
      throw ApiError.badRequest("Insufficient wallet balance.");
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: data.amount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          type: "DEBIT",
          amount: data.amount,
          reference: data.reference,
          description: data.description,
          walletId: wallet.id,
        },
      });

      return { wallet: updated, transaction };
    });
  }

  async listTransactions(
    walletId: number,
    userId: number,
    role: string | undefined,
    query: ListTransactionsQuery
  ) {
    // Reuses getById's ownership check.
    await this.getById(walletId, userId, role);

    const { type, page, limit } = query;
    const where: Prisma.WalletTransactionWhereInput = {
      walletId,
      ...(type ? { type } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async assertReferenceUnused(reference: string) {
    const existing = await prisma.walletTransaction.findUnique({ where: { reference } });
    if (existing) {
      throw ApiError.conflict(
        "A transaction with this reference already exists (idempotency check)."
      );
    }
  }
}

export default new WalletService();
