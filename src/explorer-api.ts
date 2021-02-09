import {
  Express,
  Handler,
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';
import * as _ from 'lodash';
import { DatabaseAdapter } from './adapters';
import { BlockQuery, BlockTransactionQuery, TransactionQuery } from './types';
import { getLogger } from './utilities';

export class ExplorerAPI {
  private readonly logger = getLogger();

  constructor(private readonly api: DatabaseAdapter) {}

  public applyMiddleware({ app, path }: { app: Express; path: string }): void {
    app.use(
      path,
      Router()
        .get('/search', this.search())
        .get('/channels', this.getChannels())
        .get(['/blocks', '/blocks/recent'], this.getBlocks())
        .get('/blocks/:id', this.getBlockById())
        .get('/blocks/:id/transactions', this.getBlockTransactions())
        .get(['/transactions', 'transactions/recent'], this.getTransactions())
        .get('/transactions/:id', this.getTransactionById())
        .use(
          (
            error: Error & { statusCode: number },
            req: Request,
            res: Response
          ) => {
            this.logger.info(error);
            res
              .status(error.statusCode || 500)
              .send({ error: true, message: error.message || error });
          }
        )
    );
  }

  private search(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const term = ((req.query.q as string) || '').trim();
        if (!term) {
          return res.status(400).send({
            error: true,
            message: 'Bad Request: search term (?q=) is required',
          });
        }

        if (term.length === 64) {
          const block = await this.api.getBlockById(term).catch(() => null);
          if (block) {
            return res.send({ block });
          }
          const transaction = await this.api
            .getTransactionById(term)
            .catch(() => null);
          if (transaction) {
            return res.send({ transaction });
          }

          return res
            .status(404)
            .send({ error: true, message: `Hash not found: ${term}` });
        }

        const channel = await this.api.getChannel(term).catch(() => null);
        if (channel) {
          return res.send({ channel });
        }

        return res
          .status(404)
          .send({ error: true, message: `Not found: ${term}` });
      } catch (error) {
        return next(error);
      }
    };
  }

  private getChannels(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const channels = await this.api.getChannels();
        return res.send(channels);
      } catch (error) {
        return next(error);
      }
    };
  }

  private getBlocks(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const options: BlockQuery = {
          ...this.getCommonOptions(req.query),
          query: _.omitBy(
            {
              id: req.query.id as string,
              height: parseInt(req.query.height as string, 10) || null,
              channelName: (req.query.channelName as string) || null,
              chaincodeName: (req.query.chaincodeName as string) || null,
            },
            _.isNil
          ),
        };
        const blocks = await this.api.getBlocks(options);
        return res.send(blocks);
      } catch (error) {
        return next(error);
      }
    };
  }

  private getBlockTransactions(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const options: BlockTransactionQuery = {
          ...this.getCommonOptions(req.query),
          id: req.params.id,
        };
        const blocks = await this.api.getBlockTransactions(options);
        return res.send(blocks);
      } catch (error) {
        return next(error);
      }
    };
  }

  private getBlockById(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params.id;
        const block = await this.api.getBlockById(id);
        return res.send(block);
      } catch (error) {
        return next(error);
      }
    };
  }

  private getTransactions(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const options: TransactionQuery = {
          ...this.getCommonOptions(req.query),
          query: _.omitBy(
            {
              id: req.query.id as string,
              blockHash: (req.query.blockHash as string) || null,
              blockHeight: parseInt(req.query.height as string, 10) || null,
              channelName: (req.query.channelName as string) || null,
              chaincodeName: (req.query.chaincodeName as string) || null,
            },
            _.isNil
          ),
        };
        const blocks = await this.api.getTransactions(options);
        return res.send(blocks);
      } catch (error) {
        return next(error);
      }
    };
  }

  private getTransactionById(): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params.id;
        const block = await this.api.getTransactionById(id);
        return res.send(block);
      } catch (error) {
        return next(error);
      }
    };
  }

  private getCommonOptions(query: Request['query']) {
    return {
      page: parseInt(query.page as string, 10) || 1,
      size: parseInt(query.size as string, 10) || 25,
      sort: (query.sort as string) || 'timestamp',
      direction: query.direction === 'asc' ? 'asc' : ('desc' as 'asc' | 'desc'),
    };
  }
}
