import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = transactions.reduce(
      (obj, transaction, index) => {
        const result = {
          ...obj,
          [transaction.type]: Number(transaction.value) + obj[transaction.type],
        };

        if (index === transactions.length - 1) {
          result.total = result.income - result.outcome;
        }

        return result;
      },
      { income: 0, outcome: 0, total: 0 },
    );

    return balance;
  }
}

export default TransactionsRepository;
