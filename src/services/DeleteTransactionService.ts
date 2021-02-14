import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute({ id }: { id: string }): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const findTransaction = await transactionsRepository.findOne(id);

    if (!findTransaction) {
      throw new AppError("Transaction doesn't exist");
    }

    await transactionsRepository.remove(findTransaction);
  }
}

export default DeleteTransactionService;
