import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CsvTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const readStream = fs.createReadStream(filePath);

    const parsers = csvParse({ from_line: 2 });

    const parseCsv = readStream.pipe(parsers);

    const transactions: CsvTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !value || !type) return;

      if (!categories.includes(category)) {
        categories.push(category);
      }

      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const categoriesTitles = existentCategories.map(category => category.title);

    const addCategories = categories.filter(
      category => !categoriesTitles.includes(category),
    );

    const newCategories = categoriesRepository.create(
      addCategories.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...newCategories, ...existentCategories];

    const createTransactions = transactionsRepository.create(
      transactions.map(({ title, value, type, category }) => ({
        title,
        value,
        type,
        category: allCategories.find(cat => cat.title === category),
      })),
    );

    await transactionsRepository.save(createTransactions);

    await fs.promises.unlink(filePath);

    return createTransactions;
  }
}

export default ImportTransactionsService;
